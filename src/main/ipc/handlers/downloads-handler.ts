import type { IpcMainInvokeEvent } from "electron";
import { BrowserWindow, Notification } from "electron";
import { ipcChannels } from "@shared/contracts/ipc-contracts";
import { downloadEnqueueSchema } from "@shared/validation/schemas";
import { DownloadQueue } from "../../downloads/download-queue";
import { resolveDownloadPlan } from "../../mods/mod-download-plan";
import { ensureAccessibleModsFolder } from "../../mods/mod-paths";
import type {
  OperationResult,
  DownloadProgress,
  DownloadRequest,
} from "@shared/types/mod";
import type { SettingsService } from "../../services/settings-service";
import { logInfo, logError } from "../../logging/logger";

export function createDownloadsHandler(settingsService: SettingsService) {
  const queue = new DownloadQueue();
  const seenStates = new Map<string, string>();

  void settingsService
    .getSettings()
    .then((settings) => {
      queue.setConcurrency(settings.concurrency);
    })
    .catch(() => undefined);

  queue.on("progress", (progress) => {
    void (async () => {
      try {
        for (const window of BrowserWindow.getAllWindows()) {
          window.webContents.send(ipcChannels.downloads.subscribe, progress);
        }

        const previousState = seenStates.get(progress.key);
        seenStates.set(progress.key, progress.state);

        if (previousState === progress.state) {
          return;
        }

        if (!["completed", "failed"].includes(progress.state)) {
          return;
        }

        // Clean up seenStates entry to prevent memory leak
        seenStates.delete(progress.key);

        // Log download completion/failure
        if (progress.state === "completed") {
          await logInfo("downloads", "Download completed", {
            modName: progress.modName,
            version: progress.version,
          });
        } else {
          await logError("downloads", "Download failed", {
            modName: progress.modName,
            version: progress.version,
            error: progress.message,
          });
        }

        const settings = await settingsService.getSettings();
        if (!settings.desktopNotifications || !Notification.isSupported()) {
          return;
        }

        const body =
          progress.state === "completed"
            ? `${progress.modName} ${progress.version} is ready.`
            : (progress.message ?? `Failed to download ${progress.modName}.`);

        new Notification({
          title:
            progress.state === "completed"
              ? "Mod download complete"
              : "Mod download failed",
          body,
          silent: false,
        }).show();
      } catch (error) {
        await logError("downloads", "Failed to handle download progress.", {
          error: error instanceof Error ? error.message : String(error),
        }).catch(() => undefined);
      }
    })();
  });

  return {
    queue,
    enqueue: async (
      _event: IpcMainInvokeEvent,
      input: unknown,
    ): Promise<OperationResult<string>> => {
      const parsed = downloadEnqueueSchema.safeParse(input);
      if (!parsed.success) {
        return { ok: false, error: "Invalid download request." };
      }

      const settings = await settingsService.getSettings();
      const modsFolder = await ensureAccessibleModsFolder(settings.modsFolder);
      queue.setConcurrency(settings.concurrency);

      const plan = await resolveDownloadPlan({
        ...parsed.data,
        targetFolder: modsFolder,
        replaceExisting: false,
        includeDependencies: Boolean(parsed.data.includeDependencies),
      });

      const queued = plan.map((request) => queue.enqueue(request));
      const root = queued.at(-1) ?? queued[0];

      if (!root) {
        return { ok: false, error: "Nothing was queued for download." };
      }

      await logInfo("downloads", "Enqueued downloads", {
        count: queued.length,
        modName: parsed.data.modName,
        version: parsed.data.version,
      });

      return { ok: true, data: root.key };
    },
    retry: async (
      _event: IpcMainInvokeEvent,
      download: DownloadProgress,
    ): Promise<OperationResult<string>> => {
      const settings = await settingsService.getSettings();
      const modsFolder = await ensureAccessibleModsFolder(settings.modsFolder);
      queue.setConcurrency(settings.concurrency);
      const request: DownloadRequest = {
        modName: download.modName,
        version: download.version,
        targetFolder: modsFolder,
        replaceExisting: true,
      };
      const plan = await resolveDownloadPlan({
        ...request,
        includeDependencies: false,
      });

      const queued = plan.map((req) => queue.enqueue(req));
      const root = queued.at(-1) ?? queued[0];

      if (!root) {
        return { ok: false, error: "Nothing was queued for download." };
      }

      await logInfo("downloads", "Retrying downloads", {
        count: queued.length,
        modName: download.modName,
        version: download.version,
      });

      return { ok: true, data: root.key };
    },
    list: async (): Promise<
      OperationResult<ReturnType<typeof queue.list>>
    > => ({
      ok: true,
      data: queue.list(),
    }),
  };
}
