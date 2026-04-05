import assert from "node:assert/strict";
import test from "node:test";
import { buildSyncPreview, getEmptySyncPlanMessage } from "./sync-preview.ts";
import type {
  InstalledMod,
  ModDetails,
  ModListEntry,
  SyncFromModListPreview,
} from "@shared/types/mod";

function createDetails(modName: string, version: string): ModDetails {
  return {
    name: modName,
    title: modName,
    summary: modName,
    owner: "owner",
    tags: [],
    description: modName,
    releases: [
      {
        version,
        releasedAt: "2026-01-01",
        downloadPath: `/${modName}_${version}.zip`,
        fileName: `${modName}_${version}.zip`,
        dependencies: [],
      },
    ],
    latestRelease: {
      version,
      releasedAt: "2026-01-01",
      downloadPath: `/${modName}_${version}.zip`,
      fileName: `${modName}_${version}.zip`,
      dependencies: [],
    },
  };
}

async function buildPreviewFor({
  managedMods,
  installed,
  includeDisabled,
}: {
  managedMods: ModListEntry[];
  installed: InstalledMod[];
  includeDisabled: boolean;
}) {
  return buildSyncPreview({
    managedMods,
    modList: managedMods,
    installed,
    modsFolder: "C:\\mods",
    includeDisabled,
    getDetails: async (modName) => createDetails(modName, "1.1.0"),
  });
}

test("buildSyncPreview queues a disabled mod when its archive is missing", async () => {
  const managedMods: ModListEntry[] = [
    { name: "alpha", enabled: false, version: "1.1.0" },
  ];

  const result = await buildPreviewFor({
    managedMods,
    installed: [],
    includeDisabled: false,
  });

  assert.equal(result.preview.downloadCount, 1);
  assert.equal(result.preview.updateCount, 0);
  assert.equal(result.preview.skipCount, 0);
  assert.deepEqual(result.enqueueRequests, [
    {
      modName: "alpha",
      version: "1.1.0",
      targetFolder: "C:\\mods",
      replaceExisting: false,
    },
  ]);
  assert.equal(
    result.preview.downloads[0]?.reason,
    "Archive is missing; sync will re-download it even though the mod is disabled.",
  );
});

test("buildSyncPreview skips disabled installed archives when disabled sync is excluded", async () => {
  const managedMods: ModListEntry[] = [
    { name: "alpha", enabled: false, version: "1.1.0" },
  ];
  const installed: InstalledMod[] = [
    {
      name: "alpha",
      version: "1.0.0",
      fileName: "alpha_1.0.0.zip",
      filePath: "C:\\mods\\alpha_1.0.0.zip",
      enabled: false,
      managedByModList: true,
    },
  ];

  const result = await buildPreviewFor({
    managedMods,
    installed,
    includeDisabled: false,
  });

  assert.equal(result.preview.downloadCount, 0);
  assert.equal(result.preview.updateCount, 0);
  assert.equal(result.preview.skipCount, 1);
  assert.deepEqual(result.enqueueRequests, []);
  assert.equal(
    result.preview.skips[0]?.reason,
    "Archive already exists, and disabled entries are excluded from sync updates.",
  );
});

test("buildSyncPreview updates disabled installed archives when disabled sync is included", async () => {
  const managedMods: ModListEntry[] = [
    { name: "alpha", enabled: false, version: "1.1.0" },
  ];
  const installed: InstalledMod[] = [
    {
      name: "alpha",
      version: "1.0.0",
      fileName: "alpha_1.0.0.zip",
      filePath: "C:\\mods\\alpha_1.0.0.zip",
      enabled: false,
      managedByModList: true,
    },
  ];

  const result = await buildPreviewFor({
    managedMods,
    installed,
    includeDisabled: true,
  });

  assert.equal(result.preview.downloadCount, 0);
  assert.equal(result.preview.updateCount, 1);
  assert.equal(result.preview.skipCount, 0);
  assert.deepEqual(result.enqueueRequests, [
    {
      modName: "alpha",
      version: "1.1.0",
      targetFolder: "C:\\mods",
      replaceExisting: true,
      existingFilePath: "C:\\mods\\alpha_1.0.0.zip",
    },
  ]);
});

test("buildSyncPreview treats already-matching archives as a no-op", async () => {
  const managedMods: ModListEntry[] = [
    { name: "alpha", enabled: true, version: "1.1.0" },
  ];
  const installed: InstalledMod[] = [
    {
      name: "alpha",
      version: "1.1.0",
      fileName: "alpha_1.1.0.zip",
      filePath: "C:\\mods\\alpha_1.1.0.zip",
      enabled: true,
      managedByModList: true,
    },
  ];

  const result = await buildPreviewFor({
    managedMods,
    installed,
    includeDisabled: false,
  });

  assert.equal(result.preview.queueableCount, 0);
  assert.equal(result.preview.downloadCount, 0);
  assert.equal(result.preview.updateCount, 0);
  assert.equal(result.preview.skipCount, 1);
  assert.equal(result.preview.problemCount, 0);
  assert.deepEqual(result.enqueueRequests, []);
  assert.equal(
    getEmptySyncPlanMessage(result.preview),
    "Sync from mod-list did not need to queue anything. Matching archives are already present, and disabled entries stay unchanged unless you include them.",
  );
});

test("buildSyncPreview records portal lookup failures as problems while still queueing other mods", async () => {
  const managedMods: ModListEntry[] = [
    { name: "alpha", enabled: true, version: "1.1.0" },
    { name: "broken", enabled: true, version: "9.9.9" },
  ];

  const result = await buildSyncPreview({
    managedMods,
    modList: managedMods,
    installed: [],
    modsFolder: "C:\\mods",
    includeDisabled: false,
    getDetails: async (modName) => {
      if (modName === "broken") {
        throw new Error("portal down");
      }

      return createDetails(modName, "1.1.0");
    },
  });

  assert.equal(result.preview.downloadCount, 1);
  assert.equal(result.preview.problemCount, 1);
  assert.deepEqual(result.enqueueRequests, [
    {
      modName: "alpha",
      version: "1.1.0",
      targetFolder: "C:\\mods",
      replaceExisting: false,
    },
  ]);
  assert.deepEqual(result.preview.problems, [
    {
      name: "broken",
      action: "problem",
      targetVersion: "9.9.9",
      reason: "Could not load mod details from the portal.",
      enabled: true,
      willApply: false,
    },
  ]);
});

test("buildSyncPreview marks previously managed installed mods missing from mod-list as removals", async () => {
  const installed: InstalledMod[] = [
    {
      name: "orphaned",
      version: "1.0.0",
      fileName: "orphaned_1.0.0.zip",
      filePath: "C:\\mods\\orphaned_1.0.0.zip",
      enabled: true,
      managedByModList: true,
    },
    {
      name: "unmanaged",
      version: "1.0.0",
      fileName: "unmanaged_1.0.0.zip",
      filePath: "C:\\mods\\unmanaged_1.0.0.zip",
      enabled: true,
      managedByModList: false,
    },
  ];

  const result = await buildPreviewFor({
    managedMods: [],
    installed,
    includeDisabled: false,
  });

  assert.equal(result.preview.removeCount, 1);
  assert.deepEqual(result.preview.removals, [
    {
      name: "orphaned",
      action: "remove",
      installedVersion: "1.0.0",
      enabled: true,
      reason:
        "Managed by mod-list before, but not present in the current mod-list.",
      willApply: false,
    },
  ]);
});

test("buildSyncPreview falls back to the latest available release when mod-list does not pin a version", async () => {
  const managedMods: ModListEntry[] = [{ name: "alpha", enabled: true }];

  const result = await buildSyncPreview({
    managedMods,
    modList: managedMods,
    installed: [],
    modsFolder: "C:\\mods",
    includeDisabled: false,
    getDetails: async (modName) => createDetails(modName, "2.0.0"),
  });

  assert.deepEqual(result.enqueueRequests, [
    {
      modName: "alpha",
      version: "2.0.0",
      targetFolder: "C:\\mods",
      replaceExisting: false,
    },
  ]);
  assert.equal(result.preview.downloads[0]?.targetVersion, "2.0.0");
});

test("getEmptySyncPlanMessage distinguishes no-op plans from portal failures", () => {
  const noOpPreview: SyncFromModListPreview = {
    includeDisabled: false,
    queueableCount: 0,
    downloadCount: 0,
    updateCount: 0,
    skipCount: 1,
    removeCount: 0,
    problemCount: 0,
    downloads: [],
    updates: [],
    skips: [
      {
        name: "alpha",
        action: "skip",
        reason: "Already installed at the version sync would queue.",
        willApply: false,
      },
    ],
    removals: [],
    problems: [],
  };
  const problemPreview: SyncFromModListPreview = {
    includeDisabled: false,
    queueableCount: 0,
    downloadCount: 0,
    updateCount: 0,
    skipCount: 0,
    removeCount: 0,
    problemCount: 1,
    downloads: [],
    updates: [],
    skips: [],
    removals: [],
    problems: [
      {
        name: "alpha",
        action: "problem",
        reason: "Could not load mod details from the portal.",
        willApply: false,
      },
    ],
  };

  assert.equal(
    getEmptySyncPlanMessage(noOpPreview),
    "Sync from mod-list did not need to queue anything. Matching archives are already present, and disabled entries stay unchanged unless you include them.",
  );
  assert.equal(
    getEmptySyncPlanMessage(problemPreview),
    "No mods from mod-list could be queued. Check that the listed mods exist on the portal and have downloadable releases.",
  );
});
