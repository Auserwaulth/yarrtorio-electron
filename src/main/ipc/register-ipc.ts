import { ipcMain } from "electron";
import { ipcChannels } from "@shared/contracts/ipc-contracts";
import { createModsHandler } from "./handlers/mods-handler";
import { createDownloadsHandler } from "./handlers/downloads-handler";
import { createSettingsHandler } from "./handlers/settings-handler";
import { createAppHandler } from "./handlers/app-handler";
import { createExternalHandler } from "./handlers/external-handler";
import type { SettingsService } from "../services/settings-service";
import { logError } from "../logging/logger";
import type { OperationResult } from "@shared/types/mod";

function normalizeErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Unexpected app error. Please include your Yarrtorio log file in the bug report.";
}

function safeHandle<T>(
  scope: string,
  handler: (...args: any[]) => Promise<OperationResult<T>> | OperationResult<T>,
) {
  return async (...args: any[]): Promise<OperationResult<T>> => {
    try {
      return await handler(...args);
    } catch (error) {
      await logError(scope, "Unhandled IPC error.", error);
      return { ok: false, error: normalizeErrorMessage(error) };
    }
  };
}

export function registerIpc(settingsService: SettingsService): void {
  const downloadsHandler = createDownloadsHandler(settingsService);
  const modsHandler = createModsHandler(
    settingsService,
    downloadsHandler.queue,
  );
  const settingsHandler = createSettingsHandler(settingsService);
  const appHandler = createAppHandler();
  const externalHandler = createExternalHandler();

  ipcMain.handle(
    ipcChannels.mods.browse,
    safeHandle("mods:browse", modsHandler.browse),
  );
  ipcMain.handle(
    ipcChannels.mods.details,
    safeHandle("mods:details", modsHandler.details),
  );
  ipcMain.handle(
    ipcChannels.mods.installed,
    safeHandle("mods:installed", modsHandler.installed),
  );
  ipcMain.handle(
    ipcChannels.mods.syncFromModList,
    safeHandle("mods:sync-from-mod-list", modsHandler.syncFromModList),
  );
  ipcMain.handle(
    ipcChannels.mods.deleteInstalled,
    safeHandle("mods:delete-installed", modsHandler.deleteInstalled),
  );
  ipcMain.handle(
    ipcChannels.mods.queueUpdateInstalled,
    safeHandle("mods:queue-update-installed", modsHandler.queueUpdateInstalled),
  );
  ipcMain.handle(
    ipcChannels.mods.setEnabled,
    safeHandle("mods:set-enabled", modsHandler.setEnabled),
  );

  ipcMain.handle(
    ipcChannels.downloads.enqueue,
    safeHandle("downloads:enqueue", downloadsHandler.enqueue),
  );
  ipcMain.handle(
    ipcChannels.downloads.list,
    safeHandle("downloads:list", downloadsHandler.list),
  );

  ipcMain.handle(
    ipcChannels.settings.get,
    safeHandle("settings:get", settingsHandler.get),
  );
  ipcMain.handle(
    ipcChannels.settings.update,
    safeHandle("settings:update", settingsHandler.update),
  );
  ipcMain.handle(
    ipcChannels.settings.chooseFolder,
    safeHandle("settings:choose-folder", settingsHandler.chooseFolder),
  );
  ipcMain.handle(
    ipcChannels.settings.chooseModListFile,
    safeHandle(
      "settings:choose-mod-list-file",
      settingsHandler.chooseModListFile,
    ),
  );

  ipcMain.handle(ipcChannels.app.meta, safeHandle("app:meta", appHandler.meta));
  ipcMain.handle(ipcChannels.external.openUrl, externalHandler.openUrl);
  ipcMain.handle(ipcChannels.external.openPath, externalHandler.openPath);
}
