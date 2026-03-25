import {
  modToggleImpactSchema,
  setModEnabledSchema,
} from "@shared/validation/schemas";
import { getModToggleImpact } from "../../../mods/mod-toggle-impact";
import { upsertModListEntry } from "../../../mods/mod-parser";
import type { IpcMainInvokeEvent } from "electron";
import type { ModToggleImpact, OperationResult } from "@shared/types/mod";
import type { SettingsService } from "../../../services/settings-service";
import { loadInstalledMods } from "./installed-mods";

export function createToggleHandlers(settingsService: SettingsService) {
  return {
    getModToggleImpact: async (
      _event: IpcMainInvokeEvent,
      input: unknown,
    ): Promise<OperationResult<ModToggleImpact>> => {
      const parsed = modToggleImpactSchema.safeParse(input);

      if (!parsed.success) {
        return { ok: false, error: "Invalid mod toggle payload." };
      }

      const settings = await settingsService.getSettings();

      if (!settings.modsFolder) {
        return {
          ok: true,
          data: {
            modName: parsed.data.modName,
            enabled: parsed.data.enabled,
            relatedRequiredDependencies: [],
            dependentMods: [],
          },
        };
      }

      return {
        ok: true,
        data: await getModToggleImpact(
          await loadInstalledMods(settingsService),
          parsed.data.modName,
          parsed.data.enabled,
        ),
      };
    },

    setEnabled: async (
      _event: IpcMainInvokeEvent,
      input: unknown,
    ): Promise<OperationResult<boolean>> => {
      const parsed = setModEnabledSchema.safeParse(input);
      if (!parsed.success) {
        return { ok: false, error: "Invalid mod toggle payload." };
      }

      const settings = await settingsService.getSettings();
      const affectedModNames = new Set([
        parsed.data.modName,
        ...parsed.data.relatedModNames,
      ]);

      for (const name of affectedModNames) {
        await upsertModListEntry(settings, {
          name,
          enabled: parsed.data.enabled,
        });
      }

      return { ok: true, data: true };
    },
  };
}
