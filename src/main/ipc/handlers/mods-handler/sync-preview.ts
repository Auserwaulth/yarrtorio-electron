import type {
  DownloadRequest,
  InstalledMod,
  ModDetails,
  ModListEntry,
  ModSummary,
  SyncFromModListPreview,
  SyncPreviewItem,
} from "@shared/types/mod";

interface BuildSyncPreviewParams {
  managedMods: ModListEntry[];
  modList: ModListEntry[];
  installed: InstalledMod[];
  modsFolder: string;
  includeDisabled: boolean;
  getDetails(modName: string): Promise<ModDetails>;
}

interface BuildSyncPreviewResult {
  preview: SyncFromModListPreview;
  enqueueRequests: DownloadRequest[];
  queuedMods: ModSummary[];
}

export function getEmptySyncPlanMessage(
  preview: SyncFromModListPreview,
): string {
  if (
    preview.problemCount > 0 &&
    preview.skipCount === 0 &&
    preview.removeCount === 0
  ) {
    return "No mods from mod-list could be queued. Check that the listed mods exist on the portal and have downloadable releases.";
  }

  return "Sync from mod-list did not need to queue anything. Matching archives are already present, and disabled entries stay unchanged unless you include them.";
}

function createPreviewItem(
  item: Omit<SyncPreviewItem, "willApply"> & { willApply?: boolean },
): SyncPreviewItem {
  return {
    name: item.name,
    action: item.action,
    reason: item.reason,
    ...(item.targetVersion !== undefined
      ? { targetVersion: item.targetVersion }
      : {}),
    ...(item.installedVersion !== undefined
      ? { installedVersion: item.installedVersion }
      : {}),
    ...(item.enabled !== undefined ? { enabled: item.enabled } : {}),
    willApply:
      item.willApply ??
      (item.action === "download" || item.action === "update"),
  };
}

export async function buildSyncPreview({
  managedMods,
  modList,
  installed,
  modsFolder,
  includeDisabled,
  getDetails,
}: BuildSyncPreviewParams): Promise<BuildSyncPreviewResult> {
  const downloads: SyncPreviewItem[] = [];
  const updates: SyncPreviewItem[] = [];
  const skips: SyncPreviewItem[] = [];
  const removals: SyncPreviewItem[] = [];
  const problems: SyncPreviewItem[] = [];
  const queuedMods: ModSummary[] = [];
  const enqueueRequests: DownloadRequest[] = [];

  const detailsResults = await Promise.allSettled(
    managedMods.map((entry) => getDetails(entry.name)),
  );
  const managedModNames = new Set(managedMods.map((entry) => entry.name));
  const modListByName = new Map(modList.map((entry) => [entry.name, entry]));

  for (let index = 0; index < managedMods.length; index += 1) {
    const entry = managedMods[index]!;
    const result = detailsResults[index];

    if (!result || result.status === "rejected") {
      problems.push(
        createPreviewItem({
          name: entry.name,
          action: "problem",
          ...(entry.version ? { targetVersion: entry.version } : {}),
          reason: "Could not load mod details from the portal.",
          enabled: entry.enabled,
          willApply: false,
        }),
      );
      continue;
    }

    const details = result.value;
    const targetVersion =
      entry.version ??
      details.latestRelease?.version ??
      details.releases[0]?.version;

    if (!targetVersion) {
      problems.push(
        createPreviewItem({
          name: entry.name,
          action: "problem",
          reason: "No downloadable release could be resolved for this mod.",
          enabled: entry.enabled,
          willApply: false,
        }),
      );
      continue;
    }

    const existing = installed.find((item) => item.name === entry.name);
    const baseItem = {
      name: entry.name,
      targetVersion,
      enabled: entry.enabled,
      ...(existing?.version ? { installedVersion: existing.version } : {}),
    };

    if (!existing) {
      downloads.push(
        createPreviewItem({
          ...baseItem,
          action: "download",
          reason: entry.enabled
            ? "Archive is missing; sync will queue a download."
            : "Archive is missing; sync will re-download it even though the mod is disabled.",
        }),
      );
      enqueueRequests.push({
        modName: entry.name,
        version: targetVersion,
        targetFolder: modsFolder,
        replaceExisting: false,
      });
      queuedMods.push(details);
      continue;
    }

    if (!includeDisabled && !entry.enabled) {
      skips.push(
        createPreviewItem({
          ...baseItem,
          action: "skip",
          reason:
            "Archive already exists, and disabled entries are excluded from sync updates.",
          willApply: false,
        }),
      );
      continue;
    }

    if (existing.version !== targetVersion) {
      updates.push(
        createPreviewItem({
          ...baseItem,
          action: "update",
          reason: "Installed version differs from the mod-list target version.",
        }),
      );
      enqueueRequests.push({
        modName: entry.name,
        version: targetVersion,
        targetFolder: modsFolder,
        replaceExisting: true,
        existingFilePath: existing.filePath,
      });
      queuedMods.push(details);
      continue;
    }

    skips.push(
      createPreviewItem({
        ...baseItem,
        action: "skip",
        reason: "Already installed at the version sync would queue.",
        willApply: false,
      }),
    );
  }

  for (const installedMod of installed) {
    if (
      !installedMod.managedByModList ||
      managedModNames.has(installedMod.name)
    ) {
      continue;
    }

    const modListEntry = modListByName.get(installedMod.name);
    const reason = modListEntry
      ? "Present in mod-list but excluded from the current sync plan."
      : "Managed by mod-list before, but not present in the current mod-list.";

    removals.push(
      createPreviewItem({
        name: installedMod.name,
        action: "remove",
        installedVersion: installedMod.version,
        ...(installedMod.enabled !== undefined
          ? { enabled: installedMod.enabled }
          : {}),
        reason,
        willApply: false,
      }),
    );
  }

  return {
    preview: {
      includeDisabled,
      queueableCount: downloads.length + updates.length,
      downloadCount: downloads.length,
      updateCount: updates.length,
      skipCount: skips.length,
      removeCount: removals.length,
      problemCount: problems.length,
      downloads,
      updates,
      skips,
      removals,
      problems,
    },
    enqueueRequests,
    queuedMods,
  };
}
