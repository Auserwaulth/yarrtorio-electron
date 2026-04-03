import {
  browseFiltersSchema,
  manageInstalledModSchema,
  syncRequestSchema,
} from "@shared/validation/schemas";
import { filterManagedMods } from "../../../mods/disabled-mods";
import {
  deleteInstalledArchive,
  listInstalledMods,
} from "../../../mods/mod-installer";
import { browseMods, getModDetails } from "../../../mods/mod-resolver";
import {
  parseModList,
  removeModListEntry,
  upsertModListEntry,
} from "../../../mods/mod-parser";
import {
  ensureAccessibleModsFolder,
  resolveArchivePathWithinFolder,
} from "../../../mods/mod-paths";
import type { IpcMainInvokeEvent } from "electron";
import type { DownloadQueue } from "../../../downloads/download-queue";
import type {
  AppSettings,
  BrowseResult,
  InstalledMod,
  ModListEntry,
  ModLibraryState,
  ModDetails,
  ModSummary,
  OperationResult,
} from "@shared/types/mod";
import type { SettingsService } from "../../../services/settings-service";
import {
  getInstalledConflictsResult,
  getInstalledResult,
  loadInstalledMods,
} from "./installed-mods";
import {
  queueUpdateAllInstalled,
  type BulkUpdateInstalledResult,
} from "./bulk-update-installed";
import { deleteInstalledWithRollback } from "./delete-installed-with-rollback";
import {
  loadLibraryState,
  serializeLibraryState,
  withLibraryState,
} from "./library-state";
import { createProfileHandlers } from "./profile-handlers";
import { createToggleHandlers } from "./toggle-handlers";

/**
 * Creates the IPC handler set behind the renderer's mods API.
 *
 * The returned methods validate renderer input, coordinate settings and mod
 * services, and translate internal results into `OperationResult` payloads that
 * are safe to expose across the IPC boundary.
 *
 * @param settingsService - Settings facade used to resolve user configuration.
 * @param queue - Shared download queue used for install/update requests.
 * @returns A collection of IPC invoke handlers for mod-related operations.
 */
export function createModsHandler(
  settingsService: SettingsService,
  queue: DownloadQueue,
) {
  const profileHandlers = createProfileHandlers(settingsService);
  const toggleHandlers = createToggleHandlers(settingsService);

  async function getModsFolder() {
    const settings = await settingsService.getSettings();
    return {
      settings,
      modsFolder: await ensureAccessibleModsFolder(settings.modsFolder),
    };
  }

  async function resolveInstalledArchivePath(
    modsFolder: string,
    modName: string,
    fileName: string,
  ): Promise<string> {
    const resolvedFilePath = resolveArchivePathWithinFolder(
      modsFolder,
      fileName,
    );
    const installed = await listInstalledMods(modsFolder);
    const match = installed.find(
      (item) => item.filePath === resolvedFilePath && item.name === modName,
    );

    if (!match) {
      throw new Error(
        "Installed mod file was not found in the configured mods folder.",
      );
    }

    return match.filePath;
  }
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
        return { ok: false, error: "Invalid mod name." };
      }

      const details = await getModDetails(modName);
      const libraryState = await loadLibraryState(settingsService);

      return { ok: true, data: withLibraryState(details, libraryState) };
    },

    installed: async (): Promise<OperationResult<InstalledMod[]>> =>
      getInstalledResult(settingsService),

    getLibraryState: async (): Promise<
      OperationResult<Record<string, ModLibraryState>>
    > => ({
      ok: true,
      data: serializeLibraryState(await loadLibraryState(settingsService)),
    }),

    syncFromModList: async (
      _event: IpcMainInvokeEvent,
      input: unknown,
    ): Promise<OperationResult<ModSummary[]>> => {
      const { settings, modsFolder } = await getModsFolder();

      const parsed = syncRequestSchema.safeParse(input);

      if (!parsed.success) {
        return { ok: false, error: "Invalid sync options." };
      }

      const modList = await parseModList(settings);
      const managedMods = filterManagedMods(
        modList,
        parsed.data.includeDisabled ||
          settings.includeDisabledModsByDefault ||
          !settings.ignoreDisabledMods,
      );

      if (managedMods.length === 0) {
        return {
          ok: false,
          error:
            "No eligible mods were found in mod-list. Base game and official expansion entries are skipped, and disabled mods are ignored unless your settings include them.",
        };
      }

      const installed = await listInstalledMods(modsFolder);
      const queuedMods: ModSummary[] = [];
      const detailsResults = await Promise.allSettled(
        managedMods.map((entry) => getModDetails(entry.name)),
      );
      const enqueueRequests: Array<{
        modName: string;
        version: string;
        targetFolder: string;
        replaceExisting: boolean;
        existingFilePath?: string;
      }> = [];

      for (let i = 0; i < managedMods.length; i += 1) {
        const entry = managedMods[i]!;
        const result = detailsResults[i];

        if (!result || !("value" in result)) {
          console.error(`Failed to fetch details for ${entry.name}:`, result);
          continue;
        }

        const details = result.value;
        const version =
          entry.version ??
          details.latestRelease?.version ??
          details.releases[0]?.version;

        if (!version) continue;

        const existing = installed.find((item) => item.name === entry.name);

        enqueueRequests.push({
          modName: entry.name,
          version,
          targetFolder: modsFolder,
          replaceExisting: Boolean(existing),
          ...(existing?.filePath
            ? { existingFilePath: existing.filePath }
            : {}),
        });
        queuedMods.push(details);
      }

      if (enqueueRequests.length === 0) {
        return {
          ok: false,
          error:
            "No mods from mod-list could be queued. Check that the listed mods exist on the portal and have downloadable releases.",
        };
      }

      for (const request of enqueueRequests) {
        queue.enqueue(request);
      }

      return { ok: true, data: queuedMods };
    },

    deleteInstalled: async (
      _event: IpcMainInvokeEvent,
      input: unknown,
    ): Promise<OperationResult<boolean>> => {
      const parsed = manageInstalledModSchema.safeParse(input);
      if (!parsed.success) {
        return { ok: false, error: "Invalid installed mod payload." };
      }

      const { settings, modsFolder } = await getModsFolder();
      const filePath = await resolveInstalledArchivePath(
        modsFolder,
        parsed.data.modName,
        parsed.data.fileName,
      );

      await deleteInstalledWithRollback({
        settings,
        modName: parsed.data.modName,
        filePath,
        readModList: parseModList,
        removeEntry: removeModListEntry,
        restoreEntry: upsertModListEntry,
        deleteArchive: deleteInstalledArchive,
      });

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

      const { settings, modsFolder } = await getModsFolder();
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
        targetFolder: modsFolder,
        replaceExisting: true,
        existingFilePath: await resolveInstalledArchivePath(
          modsFolder,
          parsed.data.modName,
          parsed.data.fileName,
        ),
      });

      return { ok: true, data: progress.key };
    },

    queueUpdateAllInstalled: async (): Promise<
      OperationResult<BulkUpdateInstalledResult>
    > => {
      const { settings, modsFolder } = await getModsFolder();
      const installed = await loadInstalledMods(settingsService);

      return {
        ok: true,
        data: await queueUpdateAllInstalled({
          settings,
          modsFolder,
          installed,
          getDetails: getModDetails,
          upsertEntry: upsertModListEntry,
          enqueue: (request) => {
            queue.enqueue(request);
          },
        }),
      };
    },

    getLatestVersions: async (): Promise<
      OperationResult<Record<string, string>>
    > => {
      const { modsFolder } = await getModsFolder();
      const installed = await listInstalledMods(modsFolder);
      const latestVersions: Record<string, string> = {};

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

    getInstalledConflicts: async () =>
      getInstalledConflictsResult(settingsService),

    ...profileHandlers,
    ...toggleHandlers,
  };
}
