import { listInstalledMods } from "../../../mods/mod-installer";
import { parseModList } from "../../../mods/mod-parser";
import type { ModLibraryState } from "@shared/types/mod";
import type { SettingsService } from "../../../services/settings-service";
import { logWarn } from "../../../logging/logger";

export async function loadLibraryState(settingsService: SettingsService) {
  const emptyState = {
    installedNames: new Set<string>(),
    modListEnabledByName: new Map<string, boolean>(),
  };
  const settings = await settingsService.getSettings();

  if (!settings.modsFolder) {
    return emptyState;
  }

  let installed;

  try {
    installed = await listInstalledMods(settings.modsFolder);
  } catch (error) {
    await logWarn("mods", "Failed to read installed mods for library state.", {
      error: error instanceof Error ? error.message : String(error),
    });
    return emptyState;
  }

  let modList: { name: string; enabled: boolean }[] = [];

  try {
    modList = await parseModList(settings);
  } catch (error) {
    await logWarn("mods", "Failed to parse mod list for library state.", {
      error: error instanceof Error ? error.message : String(error),
    });
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
