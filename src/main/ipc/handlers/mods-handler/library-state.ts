import { listInstalledMods } from "../../../mods/mod-installer";
import { parseModList } from "../../../mods/mod-parser";
import type { ModLibraryState } from "@shared/types/mod";
import type { SettingsService } from "../../../services/settings-service";

export async function loadLibraryState(settingsService: SettingsService) {
  const settings = await settingsService.getSettings();

  if (!settings.modsFolder) {
    return {
      installedNames: new Set<string>(),
      modListEnabledByName: new Map<string, boolean>(),
    };
  }

  const installed = await listInstalledMods(settings.modsFolder);
  let modList: { name: string; enabled: boolean }[] = [];

  try {
    modList = await parseModList(settings);
  } catch {
    modList = [];
  }

  return {
    installedNames: new Set(installed.map((item) => item.name)),
    modListEnabledByName: new Map(
      modList.map((item) => [item.name, item.enabled]),
    ),
  };
}

export function serializeLibraryState(
  state: Awaited<ReturnType<typeof loadLibraryState>>,
): Record<string, ModLibraryState> {
  const modNames = new Set([
    ...state.installedNames,
    ...state.modListEnabledByName.keys(),
  ]);

  return Object.fromEntries(
    Array.from(modNames, (name) => [
      name,
      {
        isInstalled: state.installedNames.has(name),
        isInModList: state.modListEnabledByName.has(name),
        isEnabledInModList: state.modListEnabledByName.get(name) ?? false,
      },
    ]),
  );
}

export function withLibraryState<T extends { name: string }>(
  item: T,
  state: Awaited<ReturnType<typeof loadLibraryState>>,
) {
  return {
    ...item,
    libraryState: {
      isInstalled: state.installedNames.has(item.name),
      isInModList: state.modListEnabledByName.has(item.name),
      isEnabledInModList: state.modListEnabledByName.get(item.name) ?? false,
    },
  };
}
