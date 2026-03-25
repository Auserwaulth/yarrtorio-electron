import {
  modToggleImpactSchema,
  setModEnabledSchema,
} from "@shared/validation/schemas";
import { getModToggleImpact } from "../../../mods/mod-toggle-impact";
import { parseModList, writeModList } from "../../../mods/mod-parser";
import type { IpcMainInvokeEvent } from "electron";
import type {
  ModListEntry,
  ModToggleImpact,
  OperationResult,
} from "@shared/types/mod";
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
      let mods: ModListEntry[] = await parseModList(settings).catch(
        (): ModListEntry[] => [],
      );

      for (const name of affectedModNames) {
        const index = mods.findIndex((item) => item.name === name);

        if (index >= 0) {
          const existing = mods[index]!;
          mods[index] = {
            ...existing,
            enabled: parsed.data.enabled,
          };
          continue;
        }

        mods.push({
          name,
          enabled: parsed.data.enabled,
        });
      }

      mods = mods.sort((left, right) => left.name.localeCompare(right.name));
      await writeModList(settings, mods);

      return { ok: true, data: true };
    },
  };
}
