import type { IpcMainInvokeEvent } from "electron";
import { BrowserWindow, Notification } from "electron";
import { ipcChannels } from "@shared/contracts/ipc-contracts";
import { downloadRequestSchema } from "@shared/validation/schemas";
import { DownloadQueue } from "../../downloads/download-queue";
import { resolveDownloadPlan } from "../../mods/mod-download-plan";
import type { OperationResult } from "@shared/types/mod";
import type { SettingsService } from "../../services/settings-service";

export function createDownloadsHandler(settingsService: SettingsService) {
  const queue = new DownloadQueue();
  const seenStates = new Map<string, string>();

  void settingsService.getSettings().then((settings) => {
    queue.setConcurrency(settings.concurrency);
  });

  queue.on("progress", async (progress) => {
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
  });

  return {
    queue,
    enqueue: async (
      _event: IpcMainInvokeEvent,
      input: unknown,
    ): Promise<OperationResult<string>> => {
      const parsed = downloadRequestSchema.safeParse(input);
      if (!parsed.success) {
        return { ok: false, error: "Invalid download request." };
      }
      const settings = await settingsService.getSettings();
      queue.setConcurrency(settings.concurrency);
      const plan = await resolveDownloadPlan({
        ...parsed.data,
        includeDependencies: Boolean(parsed.data.includeDependencies),
      });

      const queued = plan.map((request) => queue.enqueue(request));
      const root = queued.at(-1) ?? queued[0];

      if (!root) {
        return { ok: false, error: "Nothing was queued for download." };
      }

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
