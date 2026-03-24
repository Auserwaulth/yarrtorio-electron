import {
  browseFiltersSchema,
  manageInstalledModSchema,
  modListProfileCreateSchema,
  modListProfileRemoveSchema,
  modListProfileSwitchSchema,
  modListProfileUpdateSchema,
  setModEnabledSchema,
  syncRequestSchema,
} from "@shared/validation/schemas";
import { filterManagedMods } from "../../mods/disabled-mods";
import {
  deleteInstalledArchive,
  listInstalledMods,
} from "../../mods/mod-installer";
import { browseMods, getModDetails } from "../../mods/mod-resolver";
import {
  createModListProfileStorage,
  deleteModListProfileStorage,
  getActiveModListProfile,
  parseModList,
  removeModListEntry,
  switchActiveModListProfile,
  upsertModListEntry,
} from "../../mods/mod-parser";
import type { IpcMainInvokeEvent } from "electron";
import type { DownloadQueue } from "../../downloads/download-queue";
import type {
  BrowseResult,
  InstalledMod,
  ModDetails,
  ModListProfile,
  ModSummary,
  OperationResult,
  AppSettings,
} from "@shared/types/mod";
import type { SettingsService } from "../../services/settings-service";

function buildProfileName(name: string): string {
  return name.trim() || "Untitled list";
}

async function loadLibraryState(settingsService: SettingsService) {
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

function withLibraryState<T extends { name: string }>(
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

export function createModsHandler(
  settingsService: SettingsService,
  queue: DownloadQueue,
) {
  return {
    browse: async (
      _event: IpcMainInvokeEvent,
      input: unknown,
    ): Promise<OperationResult<BrowseResult>> => {
      const parsed = browseFiltersSchema.safeParse(input);

      if (!parsed.success) {
        return {
          ok: false,
          error: "Invalid browse filters.",
        };
      }

      const result = await browseMods(parsed.data);
      const libraryState = await loadLibraryState(settingsService);

      return {
        ok: true,
        data: {
          ...result,
          items: result.items.map((item) =>
            withLibraryState(item, libraryState),
          ),
        },
      };
    },

    details: async (
      _event: IpcMainInvokeEvent,
      modName: unknown,
    ): Promise<OperationResult<ModDetails>> => {
      if (typeof modName !== "string" || !modName) {
        return {
          ok: false,
          error: "Invalid mod name.",
        };
      }

      const details = await getModDetails(modName);
      const libraryState = await loadLibraryState(settingsService);

      return {
        ok: true,
        data: withLibraryState(details, libraryState),
      };
    },

    installed: async (): Promise<OperationResult<InstalledMod[]>> => {
      const settings = await settingsService.getSettings();

      if (!settings.modsFolder) {
        return {
          ok: true,
          data: [],
        };
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

      return {
        ok: true,
        data: installed.map((item): InstalledMod => {
          const enabled = enabledByName.get(item.name);

          if (enabled !== undefined) {
            return {
              ...item,
              enabled,
              managedByModList: true,
            };
          }

          return item;
        }),
      };
    },

    syncFromModList: async (
      _event: IpcMainInvokeEvent,
      input: unknown,
    ): Promise<OperationResult<ModSummary[]>> => {
      const settings = await settingsService.getSettings();

      if (!settings.modsFolder) {
        return {
          ok: false,
          error: "Mods folder is not configured.",
        };
      }

      const parsed = syncRequestSchema.safeParse(input);

      if (!parsed.success) {
        return {
          ok: false,
          error: "Invalid sync options.",
        };
      }

      const modList = await parseModList(settings);
      const managedMods = filterManagedMods(
        modList,
        parsed.data.includeDisabled ||
          settings.includeDisabledModsByDefault ||
          !settings.ignoreDisabledMods,
      );

      const installed = await listInstalledMods(settings.modsFolder);
      const resolvedMods: ModSummary[] = [];

      // Fetch details for all managed mods in parallel
      const detailsResults = await Promise.allSettled(
        managedMods.map((entry) => getModDetails(entry.name)),
      );

      // Process results and prepare enqueue operations
      const enqueueRequests: Array<{
        modName: string;
        version: string;
        targetFolder: string;
        replaceExisting: boolean;
        existingFilePath?: string;
      }> = [];

      for (let i = 0; i < managedMods.length; i++) {
        const entry = managedMods[i]!;
        const result = detailsResults[i];

        // Skip if no result or if the promise was rejected
        if (!result || !("value" in result)) {
          console.error(`Failed to fetch details for ${entry.name}:`, result);
          continue;
        }

        const details = result.value;
        resolvedMods.push(details);

        // Use version from mod-list if specified, otherwise get latest
        const version =
          entry.version ??
          details.latestRelease?.version ??
          details.releases[0]?.version;

        if (!version) continue;

        const existing = installed.find((item) => item.name === entry.name);

        enqueueRequests.push({
          modName: entry.name,
          version,
          targetFolder: settings.modsFolder,
          replaceExisting: Boolean(existing),
          ...(existing?.filePath
            ? { existingFilePath: existing.filePath }
            : {}),
        });
      }

      // Enqueue all downloads
      for (const request of enqueueRequests) {
        queue.enqueue(request);
      }

      return {
        ok: true,
        data: resolvedMods,
      };
    },

    deleteInstalled: async (
      _event: IpcMainInvokeEvent,
      input: unknown,
    ): Promise<OperationResult<boolean>> => {
      const parsed = manageInstalledModSchema.safeParse(input);
      if (!parsed.success) {
        return { ok: false, error: "Invalid installed mod payload." };
      }

      await deleteInstalledArchive(parsed.data.filePath);
      const settings = await settingsService.getSettings();
      await removeModListEntry(settings, parsed.data.modName);

      return { ok: true, data: true };
    },

    queueUpdateInstalled: async (
      _event: IpcMainInvokeEvent,
      input: unknown,
    ): Promise<OperationResult<string>> => {
      const parsed = manageInstalledModSchema.safeParse(input);
      if (!parsed.success) {
        return { ok: false, error: "Invalid installed mod payload." };
      }

      const settings = await settingsService.getSettings();
      const details = await getModDetails(parsed.data.modName);
      const version =
        details.latestRelease?.version ?? details.releases[0]?.version;

      if (!version) {
        return { ok: false, error: "No downloadable release found." };
      }

      await upsertModListEntry(settings, {
        name: parsed.data.modName,
        enabled: true,
        version,
      });

      const progress = queue.enqueue({
        modName: parsed.data.modName,
        version,
        targetFolder: settings.modsFolder,
        replaceExisting: true,
        existingFilePath: parsed.data.filePath,
      });

      return { ok: true, data: progress.key };
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
      await upsertModListEntry(settings, {
        name: parsed.data.modName,
        enabled: parsed.data.enabled,
      });
      return { ok: true, data: true };
    },

    getLatestVersions: async (): Promise<
      OperationResult<Record<string, string>>
    > => {
      const settings = await settingsService.getSettings();

      if (!settings.modsFolder) {
        return { ok: true, data: {} };
      }

      const installed = await listInstalledMods(settings.modsFolder);
      const latestVersions: Record<string, string> = {};

      // Fetch latest version for each installed mod
      await Promise.all(
        installed.map(async (mod) => {
          try {
            const details = await getModDetails(mod.name);
            const latest =
              details.latestRelease?.version ?? details.releases[0]?.version;
            if (latest) {
              latestVersions[mod.name] = latest;
            }
          } catch {
            // Ignore errors for individual mods
          }
        }),
      );

      return { ok: true, data: latestVersions };
    },

    createModListProfile: async (
      _event: IpcMainInvokeEvent,
      input: unknown,
    ): Promise<OperationResult<AppSettings>> => {
      const parsed = modListProfileCreateSchema.safeParse(input);
      if (!parsed.success) {
        return { ok: false, error: "Invalid mod-list profile payload." };
      }

      const settings = await settingsService.getSettings();
      const profile: ModListProfile = {
        id: crypto.randomUUID(),
        name: buildProfileName(parsed.data.name),
      };

      await createModListProfileStorage(settings, profile.id);

      const nextSettings = await settingsService.saveSettings({
        ...settings,
        modListProfiles: [...settings.modListProfiles, profile],
      });

      return { ok: true, data: nextSettings };
    },

    renameModListProfile: async (
      _event: IpcMainInvokeEvent,
      input: unknown,
    ): Promise<OperationResult<AppSettings>> => {
      const parsed = modListProfileUpdateSchema.safeParse(input);
      if (!parsed.success) {
        return { ok: false, error: "Invalid mod-list profile payload." };
      }

      const settings = await settingsService.getSettings();
      const nextSettings = await settingsService.saveSettings({
        ...settings,
        modListProfiles: settings.modListProfiles.map((profile) =>
          profile.id === parsed.data.profileId
            ? { ...profile, name: buildProfileName(parsed.data.name) }
            : profile,
        ),
      });

      return { ok: true, data: nextSettings };
    },

    switchModListProfile: async (
      _event: IpcMainInvokeEvent,
      input: unknown,
    ): Promise<OperationResult<AppSettings>> => {
      const parsed = modListProfileSwitchSchema.safeParse(input);
      if (!parsed.success) {
        return { ok: false, error: "Invalid mod-list profile payload." };
      }

      const settings = await settingsService.getSettings();

      if (!settings.modsFolder) {
        return {
          ok: false,
          error: "Mods folder is not configured.",
        };
      }

      const targetProfile = settings.modListProfiles.find(
        (profile) => profile.id === parsed.data.profileId,
      );

      if (!targetProfile) {
        return { ok: false, error: "Mod-list profile was not found." };
      }

      await switchActiveModListProfile(settings, targetProfile.id);

      const nextSettings = await settingsService.saveSettings({
        ...settings,
        activeModListProfileId: targetProfile.id,
      });

      return { ok: true, data: nextSettings };
    },

    removeModListProfile: async (
      _event: IpcMainInvokeEvent,
      input: unknown,
    ): Promise<OperationResult<AppSettings>> => {
      const parsed = modListProfileRemoveSchema.safeParse(input);
      if (!parsed.success) {
        return { ok: false, error: "Invalid mod-list profile payload." };
      }

      const settings = await settingsService.getSettings();
      const targetProfile = settings.modListProfiles.find(
        (profile) => profile.id === parsed.data.profileId,
      );

      if (!targetProfile) {
        return { ok: false, error: "Mod-list profile was not found." };
      }

      if (settings.modListProfiles.length <= 1) {
        return { ok: false, error: "At least one mod-list profile is required." };
      }

      const remainingProfiles = settings.modListProfiles.filter(
        (profile) => profile.id !== parsed.data.profileId,
      );

      if (settings.activeModListProfileId === parsed.data.profileId) {
        const fallbackProfile = remainingProfiles[0];
        if (!fallbackProfile) {
          return { ok: false, error: "No fallback mod-list profile was found." };
        }

        if (!settings.modsFolder) {
          return {
            ok: false,
            error: "Mods folder is not configured.",
          };
        }

        await switchActiveModListProfile(
          {
            ...settings,
            modListProfiles: remainingProfiles,
            activeModListProfileId: getActiveModListProfile(settings)?.id ?? parsed.data.profileId,
          },
          fallbackProfile.id,
        );
      }

      await deleteModListProfileStorage(parsed.data.profileId);

      const nextSettings = await settingsService.saveSettings({
        ...settings,
        modListProfiles: remainingProfiles,
        activeModListProfileId:
          settings.activeModListProfileId === parsed.data.profileId
            ? remainingProfiles[0]!.id
            : settings.activeModListProfileId,
      });

      return { ok: true, data: nextSettings };
    },
  };
}
