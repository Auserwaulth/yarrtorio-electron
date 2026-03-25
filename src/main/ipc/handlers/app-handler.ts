import { app } from "electron";
import type { AppMeta } from "@shared/types/app-meta";
import type { AppUpdateState } from "@shared/types/app-update";
import type { OperationResult } from "@shared/types/mod";
import { getLogFilePath } from "../../logging/logger";
import type { AppUpdater } from "../../updater/app-updater";

export function createAppHandler(appUpdater: AppUpdater) {
  return {
    meta: async (): Promise<OperationResult<AppMeta>> => {
      return {
        ok: true,
        data: {
          name: app.getName(),
          version: app.getVersion(),
          logPath: getLogFilePath(),
        },
      };
    },
    getUpdateState: async (): Promise<OperationResult<AppUpdateState>> => ({
      ok: true,
      data: appUpdater.getState(),
    }),
    checkForUpdates: async (): Promise<OperationResult<AppUpdateState>> => ({
      ok: true,
      data: await appUpdater.checkForUpdates(),
    }),
    downloadUpdate: async (): Promise<OperationResult<AppUpdateState>> => ({
      ok: true,
      data: await appUpdater.downloadUpdate(),
    }),
    quitAndInstallUpdate: async (): Promise<OperationResult<boolean>> => ({
      ok: true,
      data: await appUpdater.quitAndInstall(),
    }),
  };
}
