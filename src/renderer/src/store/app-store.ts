import { useEffect, useMemo, useState } from "react";
import type {
  AppSettings,
  BrowsePagination,
  DownloadProgress,
  InstalledConflict,
  InstalledMod,
  ModDetails,
  ModSummary,
} from "@shared/types/mod";
import type { AppMeta } from "@shared/types/app-meta";
import type { AppUpdateState } from "@shared/types/app-update";

import { MAX_DOWNLOAD_HISTORY } from "@shared/constants";

export interface AppStore {
  settings: AppSettings | null;
  appMeta: AppMeta | null;
  appUpdate: AppUpdateState | null;
  mods: ModSummary[];
  modsPagination: BrowsePagination | null;
  selectedMod: ModDetails | null;
  selectedModLoading: boolean;
  selectedModPendingName: string | null;
  installed: InstalledMod[];
  installedConflicts: Record<string, InstalledConflict[]>;
  downloads: DownloadProgress[];
  latestVersions: Record<string, string>;
}

const initialStore: AppStore = {
  settings: null,
  appMeta: null,
  appUpdate: null,
  mods: [],
  modsPagination: null,
  selectedMod: null,
  selectedModLoading: false,
  selectedModPendingName: null,
  installed: [],
  installedConflicts: {},
  downloads: [],
  latestVersions: {},
};

function upsertRecentDownload(
  downloads: DownloadProgress[],
  progress: DownloadProgress,
): DownloadProgress[] {
  // When a new download starts (queued/running), remove any failed entries for the same mod
  if (progress.state === "queued" || progress.state === "running") {
    const filtered = downloads.filter(
      (item) =>
        !(
          item.modName === progress.modName &&
          item.version === progress.version &&
          item.state === "failed"
        ),
    );
    // Also remove the existing entry if it has the same key
    const existingIndex = filtered.findIndex(
      (item) => item.key === progress.key,
    );
    if (existingIndex === -1) {
      return [progress, ...filtered].slice(0, MAX_DOWNLOAD_HISTORY);
    }
    const next = [...filtered];
    next[existingIndex] = progress;
    return next;
  }

  const existingIndex = downloads.findIndex(
    (item) => item.key === progress.key,
  );

  if (existingIndex === -1) {
    return [progress, ...downloads].slice(0, MAX_DOWNLOAD_HISTORY);
  }

  const next = [...downloads];
  next[existingIndex] = progress;

  return next;
}

export function useAppStore() {
  const [store, setStore] = useState<AppStore>(initialStore);

  useEffect(() => {
    return window.electronApi.downloads.onProgress((progress) => {
      setStore((current) => ({
        ...current,
        downloads: upsertRecentDownload(current.downloads, progress),
      }));
    });
  }, []);

  useEffect(() => {
    return window.electronApi.app.onUpdateState((appUpdate) => {
      setStore((current) => ({ ...current, appUpdate }));
    });
  }, []);

  return useMemo(() => ({ store, setStore }), [store]);
}
