import { dialog } from "electron";
import { settingsSchema } from "@shared/validation/schemas";
import type { IpcMainInvokeEvent } from "electron";
import type { AppSettings, OperationResult } from "@shared/types/mod";
import type { SettingsService } from "../../services/settings-service";

export function createSettingsHandler(settingsService: SettingsService) {
  return {
    get: async (): Promise<OperationResult<AppSettings>> => ({
      ok: true,
      data: await settingsService.getSettings(),
    }),

    update: async (
      _event: IpcMainInvokeEvent,
      input: unknown,
    ): Promise<OperationResult<AppSettings>> => {
      const parsed = settingsSchema.safeParse(input);

      if (!parsed.success) {
        return { ok: false, error: "Invalid settings payload." };
      }

      const data = await settingsService.saveSettings(
        parsed.data as AppSettings,
      );
      return { ok: true, data };
    },

    chooseFolder: async (): Promise<OperationResult<string>> => {
      const result = await dialog.showOpenDialog({
        properties: ["openDirectory"],
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { ok: false, error: "Folder selection cancelled." };
      }

      return { ok: true, data: result.filePaths[0]! };
    },

    chooseModListFile: async (): Promise<OperationResult<string>> => {
      const result = await dialog.showOpenDialog({
        properties: ["openFile"],
        filters: [
          { name: "JSON files", extensions: ["json"] },
          { name: "All files", extensions: ["*"] },
        ],
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { ok: false, error: "File selection cancelled." };
      }

      return { ok: true, data: result.filePaths[0]! };
    },

    chooseFactorioExecutable: async (): Promise<OperationResult<string>> => {
      const result = await dialog.showOpenDialog({
        properties: ["openFile"],
        filters: [
          { name: "Executable", extensions: ["exe"] },
          { name: "All files", extensions: ["*"] },
        ],
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { ok: false, error: "File selection cancelled." };
      }

      return { ok: true, data: result.filePaths[0]! };
    },
  };
}
