import type {
  AppSettings,
  BulkUpdateInstalledResult,
  DownloadRequest,
  InstalledMod,
  ModDetails,
  ModListEntry,
} from "@shared/types/mod";
export type { BulkUpdateInstalledResult } from "@shared/types/mod";

interface QueueUpdateAllInstalledOptions {
  settings: Pick<
    AppSettings,
    "modsFolder" | "modListProfiles" | "activeModListProfileId"
  >;
  modsFolder: string;
  installed: Pick<
    InstalledMod,
    "name" | "version" | "filePath" | "enabled" | "managedByModList"
  >[];
  getDetails(modName: string): Promise<ModDetails>;
  upsertEntry(
    settings: Pick<
      AppSettings,
      "modsFolder" | "modListProfiles" | "activeModListProfileId"
    >,
    entry: ModListEntry,
  ): Promise<void>;
  enqueue(request: DownloadRequest): void;
}

function resolveLatestVersion(
  details: Pick<ModDetails, "latestRelease" | "releases">,
) {
  return details.latestRelease?.version ?? details.releases[0]?.version ?? null;
}

export async function queueUpdateAllInstalled({
  settings,
  modsFolder,
  installed,
  getDetails,
  upsertEntry,
  enqueue,
}: QueueUpdateAllInstalledOptions): Promise<BulkUpdateInstalledResult> {
  const queuedModNames: string[] = [];
  const unavailableMods: string[] = [];
  const unmanagedMods: string[] = [];
  const failedMods: Array<{ modName: string; error: string }> = [];
  let upToDateCount = 0;

  const detailsResults = await Promise.allSettled(
    installed.map((mod) => getDetails(mod.name)),
  );

  for (let index = 0; index < installed.length; index += 1) {
    const mod = installed[index]!;
    const detailsResult = detailsResults[index];

    if (!mod.managedByModList) {
      unmanagedMods.push(mod.name);
      continue;
    }

    if (!detailsResult || detailsResult.status !== "fulfilled") {
      failedMods.push({
        modName: mod.name,
        error:
          detailsResult?.reason instanceof Error
            ? detailsResult.reason.message
            : "Failed to look up the latest release.",
      });
      continue;
    }

    const version = resolveLatestVersion(detailsResult.value);

    if (!version) {
      unavailableMods.push(mod.name);
      continue;
    }

    if (version === mod.version) {
      upToDateCount += 1;
      continue;
    }

    try {
      await upsertEntry(settings, {
        name: mod.name,
        enabled: mod.enabled ?? true,
        version,
      });

      enqueue({
        modName: mod.name,
        version,
        targetFolder: modsFolder,
        replaceExisting: true,
        existingFilePath: mod.filePath,
      });

      queuedModNames.push(mod.name);
    } catch (error) {
      failedMods.push({
        modName: mod.name,
        error:
          error instanceof Error ? error.message : "Failed to queue update.",
      });
    }
  }

  return {
    checkedCount: installed.length,
    queuedCount: queuedModNames.length,
    upToDateCount,
    unavailableMods,
    unmanagedMods,
    failedMods,
    queuedModNames,
  };
}
