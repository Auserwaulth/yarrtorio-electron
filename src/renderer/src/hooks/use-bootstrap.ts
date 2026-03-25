import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { APP_NAME } from "@shared/constants";

import type { AppStore } from "../store/app-store";
import { applyTheme } from "../utils/theme";
import { MAX_DOWNLOAD_HISTORY } from "@shared/constants";
import type { OperationResult } from "@shared/types/mod";
import type { AppMeta } from "@shared/types/app-meta";
import type { AppUpdateState } from "@shared/types/app-update";
import type {
  AppSettings,
  DownloadProgress,
  InstalledMod,
} from "@shared/types/mod";

interface BootstrapState {
  loading: boolean;
  progress: number;
  stage: string;
  error: string | null;
}

type BootstrapTaskResult =
  | OperationResult<AppSettings>
  | OperationResult<InstalledMod[]>
  | OperationResult<DownloadProgress[]>
  | OperationResult<AppMeta>
  | OperationResult<AppUpdateState>;

interface BootstrapTask {
  label: string;
  targetProgress: number;
  run: () => Promise<BootstrapTaskResult>;
}

const initialState: BootstrapState = {
  loading: true,
  progress: 0,
  stage: `Starting ${APP_NAME}`,
  error: null,
};

const MIN_BOOT_DURATION_MS = 5200;
const COMPLETION_LINGER_MS = 550;
const TICK_MS = 16;
const MAX_INCOMPLETE_PROGRESS = 96;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function useBootstrap(setStore: Dispatch<SetStateAction<AppStore>>) {
  const [state, setState] = useState<BootstrapState>(initialState);

  useEffect(() => {
    let cancelled = false;
    let displayedProgress = 0;
    let targetProgress = 0;

    const tasks: readonly BootstrapTask[] = [
      {
        label: "Loading settings…",
        targetProgress: 24,
        run: () => window.electronApi.settings.get(),
      },
      {
        label: "Reading installed mods…",
        targetProgress: 52,
        run: () => window.electronApi.mods.installed(),
      },
      {
        label: "Restoring download history…",
        targetProgress: 76,
        run: () => window.electronApi.downloads.list(),
      },
      {
        label: "Preparing app metadata…",
        targetProgress: 90,
        run: () => window.electronApi.app.meta(),
      },
      {
        label: "Loading updater statusâ€¦",
        targetProgress: 96,
        run: () => window.electronApi.app.getUpdateState(),
      },
    ];

    const animationId = window.setInterval(() => {
      if (cancelled) return;
      if (displayedProgress >= targetProgress) return;

      const distance = targetProgress - displayedProgress;
      const step = Math.max(0.35, distance * 0.11);
      displayedProgress = Math.min(targetProgress, displayedProgress + step);

      setState((current) => {
        const nextProgress = Math.max(
          current.progress,
          Math.round(displayedProgress),
        );

        if (nextProgress === current.progress) {
          return current;
        }

        return {
          ...current,
          progress: nextProgress,
        };
      });
    }, TICK_MS);

    void (async () => {
      const startedAt = Date.now();
      const results: BootstrapTaskResult[] = [];

      for (const task of tasks) {
        if (cancelled) return;

        setState((current) => ({
          ...current,
          stage: task.label,
        }));

        targetProgress = Math.max(targetProgress, task.targetProgress);
        const result = await task.run();
        results.push(result);
      }

      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, MIN_BOOT_DURATION_MS - elapsed);

      if (remaining > 0) {
        targetProgress = MAX_INCOMPLETE_PROGRESS;
        setState((current) => ({
          ...current,
          stage: "Almost there…",
        }));
        await wait(remaining);
      }

      if (cancelled) return;

      const [settings, installed, downloads, appMeta, appUpdate] = results as [
        OperationResult<AppSettings>,
        OperationResult<InstalledMod[]>,
        OperationResult<DownloadProgress[]>,
        OperationResult<AppMeta>,
        OperationResult<AppUpdateState>,
      ];

      if (settings.ok) {
        applyTheme(settings.data.theme);
      }

      setStore((current) => ({
        ...current,
        settings: settings.ok ? settings.data : current.settings,
        appMeta: appMeta.ok ? appMeta.data : current.appMeta,
        appUpdate: appUpdate.ok ? appUpdate.data : current.appUpdate,
        installed: installed.ok ? installed.data : [],
        downloads: downloads.ok
          ? downloads.data.slice(0, MAX_DOWNLOAD_HISTORY)
          : [],
      }));

      const bootstrapError = results
        .filter(
          (result): result is Extract<BootstrapTaskResult, { ok: false }> =>
            !result.ok,
        )
        .map((result) => result.error)
        .join(" ");

      targetProgress = 100;

      while (!cancelled && displayedProgress < 100) {
        await wait(TICK_MS);
      }

      if (!cancelled) {
        setState((current) => ({
          ...current,
          stage: bootstrapError ? "Started with warnings" : "Ready",
          progress: 100,
          error: bootstrapError || null,
        }));

        await wait(COMPLETION_LINGER_MS);
      }

      if (!cancelled) {
        setState((current) => ({
          ...current,
          loading: false,
        }));
      }
    })()
      .catch((error: unknown) => {
        const message =
          error instanceof Error
            ? error.message
            : `Failed to start ${APP_NAME}`;

        targetProgress = 100;
        setState({
          loading: false,
          progress: 100,
          stage: "Startup failed",
          error: message,
        });
      })
      .finally(() => {
        window.clearInterval(animationId);
      });

    return () => {
      cancelled = true;
      window.clearInterval(animationId);
    };
  }, [setStore]);

  return state;
}
