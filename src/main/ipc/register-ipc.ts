import { ipcMain } from "electron";
import { ipcChannels } from "@shared/contracts/ipc-contracts";
import { createModsHandler } from "./handlers/mods-handler";
import { createDownloadsHandler } from "./handlers/downloads-handler";
import { createSettingsHandler } from "./handlers/settings-handler";
import { createAppHandler } from "./handlers/app-handler";
import { createExternalHandler } from "./handlers/external-handler";
import { createLaunchHandler } from "./handlers/launch-handler";
import type { SettingsService } from "../services/settings-service";
import type { AppUpdater } from "../updater/app-updater";
import { logError } from "../logging/logger";
import type { OperationResult } from "@shared/types/mod";

function normalizeErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return `Unexpected app error. Please include your log file in the bug report.`;
}

/**
 * Wraps an IPC handler so unhandled exceptions are logged and returned as a
 * failed `OperationResult` instead of crashing the invoke call.
 *
 * @param scope - Log scope used when recording unexpected handler failures.
 * @param handler - IPC handler that returns an `OperationResult`.
 * @returns A handler with the same argument shape that always resolves to an
 * `OperationResult`, including when the inner handler throws.
 */
function safeHandle<T>(
  scope: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (...args: any[]) => Promise<OperationResult<T>> | OperationResult<T>,
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (...args: any[]): Promise<OperationResult<T>> => {
    try {
      return await handler(...args);
    } catch (error) {
      await logError(scope, "Unhandled IPC error.", error);
      return { ok: false, error: normalizeErrorMessage(error) };
    }
  };
}

/**
 * Registers all main-process IPC handlers used by the renderer and preload
 * bridge.
 *
 * Handler factories are created first so shared dependencies such as the
 * settings service, updater, and download queue can be wired once. Most invoke
 * handlers are wrapped with `safeHandle` so unexpected exceptions are converted
 * into a consistent `OperationResult`.
 *
 * @param settingsService - Persistent settings facade shared by IPC handlers.
 * @param appUpdater - App updater instance exposed to renderer commands.
 */
export function registerIpc(
  settingsService: SettingsService,
  appUpdater: AppUpdater,
): void {
  const downloadsHandler = createDownloadsHandler(settingsService);
  const modsHandler = createModsHandler(
    settingsService,
    downloadsHandler.queue,
  );
  const settingsHandler = createSettingsHandler(settingsService);
  const appHandler = createAppHandler(appUpdater);
  const externalHandler = createExternalHandler();
  const launchHandler = createLaunchHandler(settingsService);

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
    ipcChannels.mods.getLibraryState,
    safeHandle("mods:get-library-state", modsHandler.getLibraryState),
  );
  ipcMain.handle(
    ipcChannels.mods.getModToggleImpact,
    safeHandle("mods:get-mod-toggle-impact", modsHandler.getModToggleImpact),
  );

  ipcMain.handle(
    ipcChannels.mods.getLatestVersions,
    safeHandle("mods:get-latest-versions", modsHandler.getLatestVersions),
  );
  ipcMain.handle(
    ipcChannels.mods.getInstalledConflicts,
    safeHandle(
      "mods:get-installed-conflicts",
      modsHandler.getInstalledConflicts,
    ),
  );
  ipcMain.handle(
    ipcChannels.mods.createModListProfile,
    safeHandle(
      "mods:create-mod-list-profile",
      modsHandler.createModListProfile,
    ),
  );
  ipcMain.handle(
    ipcChannels.mods.renameModListProfile,
    safeHandle(
      "mods:rename-mod-list-profile",
      modsHandler.renameModListProfile,
    ),
  );
  ipcMain.handle(
    ipcChannels.mods.switchModListProfile,
    safeHandle(
      "mods:switch-mod-list-profile",
      modsHandler.switchModListProfile,
    ),
  );
  ipcMain.handle(
    ipcChannels.mods.removeModListProfile,
    safeHandle(
      "mods:remove-mod-list-profile",
      modsHandler.removeModListProfile,
    ),
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
    ipcChannels.downloads.retry,
    safeHandle("downloads:retry", downloadsHandler.retry),
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
  ipcMain.handle(
    ipcChannels.settings.chooseFactorioExecutable,
    safeHandle(
      "settings:choose-factorio-executable",
      settingsHandler.chooseFactorioExecutable,
    ),
  );

  ipcMain.handle(ipcChannels.app.meta, safeHandle("app:meta", appHandler.meta));
  ipcMain.handle(
    ipcChannels.app.updateState,
    safeHandle("app:update-state", appHandler.getUpdateState),
  );
  ipcMain.handle(
    ipcChannels.app.checkForUpdates,
    safeHandle("app:check-for-updates", appHandler.checkForUpdates),
  );
  ipcMain.handle(
    ipcChannels.app.downloadUpdate,
    safeHandle("app:download-update", appHandler.downloadUpdate),
  );
  ipcMain.handle(
    ipcChannels.app.quitAndInstallUpdate,
    safeHandle("app:quit-and-install-update", appHandler.quitAndInstallUpdate),
  );
  ipcMain.handle(ipcChannels.external.openUrl, externalHandler.openUrl);
  ipcMain.handle(ipcChannels.external.openPath, externalHandler.openPath);
  ipcMain.handle(
    ipcChannels.launch.launchFactorio,
    safeHandle("launch:launch-factorio", launchHandler.launchFactorio),
  );
}
