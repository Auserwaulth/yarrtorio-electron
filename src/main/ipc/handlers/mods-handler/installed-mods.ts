import { detectInstalledConflicts } from "../../../mods/mod-conflicts";
import { listInstalledMods } from "../../../mods/mod-installer";
import { parseModList } from "../../../mods/mod-parser";
import type {
  InstalledConflict,
  InstalledMod,
  OperationResult,
} from "@shared/types/mod";
import type { SettingsService } from "../../../services/settings-service";

export async function loadInstalledMods(
  settingsService: SettingsService,
): Promise<InstalledMod[]> {
  const settings = await settingsService.getSettings();

  if (!settings.modsFolder) {
    return [];
  }

  const installed = await listInstalledMods(settings.modsFolder);
  let modList: { name: string; enabled: boolean }[] = [];

  try {
    modList = await parseModList(settings);
  } catch {
    modList = [];
  }

  const enabledByName = new Map(
    modList.map((item) => [item.name, item.enabled]),
  );

  return installed.map((item): InstalledMod => {
    const enabled = enabledByName.get(item.name);

    if (enabled !== undefined) {
      return {
        ...item,
        enabled,
        managedByModList: true,
      };
    }

    return item;
  });
}

export async function getInstalledResult(
  settingsService: SettingsService,
): Promise<OperationResult<InstalledMod[]>> {
  return {
    ok: true,
    data: await loadInstalledMods(settingsService),
  };
}

export async function getInstalledConflictsResult(
  settingsService: SettingsService,
): Promise<OperationResult<Record<string, InstalledConflict[]>>> {
  const settings = await settingsService.getSettings();

  if (!settings.modsFolder) {
    return { ok: true, data: {} };
  }

  return {
    ok: true,
    data: await detectInstalledConflicts(
      await loadInstalledMods(settingsService),
    ),
  };
}
