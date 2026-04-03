import assert from "node:assert/strict";
import test from "node:test";
import { queueUpdateAllInstalled } from "./bulk-update-installed.ts";
import type {
  AppSettings,
  DownloadRequest,
  InstalledMod,
  ModDetails,
  ModListEntry,
} from "@shared/types/mod";

const settings: Pick<
  AppSettings,
  "modsFolder" | "modListProfiles" | "activeModListProfileId"
> = {
  modsFolder: "C:\\mods",
  modListProfiles: [{ id: "default", name: "Default" }],
  activeModListProfileId: "default",
};

function createDetails(version: string): ModDetails {
  return {
    name: "example",
    title: "Example",
    summary: "Example",
    owner: "owner",
    tags: [],
    description: "Example",
    releases: [
      {
        version,
        releasedAt: "2026-01-01",
        downloadPath: "/example.zip",
        fileName: `example_${version}.zip`,
        dependencies: [],
      },
    ],
    latestRelease: {
      version,
      releasedAt: "2026-01-01",
      downloadPath: "/example.zip",
      fileName: `example_${version}.zip`,
      dependencies: [],
    },
  };
}

test("queueUpdateAllInstalled queues only managed outdated mods and preserves enabled state", async () => {
  const installed: Array<
    Pick<
      InstalledMod,
      "name" | "version" | "filePath" | "enabled" | "managedByModList"
    >
  > = [
    {
      name: "outdated",
      version: "1.0.0",
      filePath: "C:\\mods\\outdated_1.0.0.zip",
      enabled: false,
      managedByModList: true,
    },
    {
      name: "current",
      version: "2.0.0",
      filePath: "C:\\mods\\current_2.0.0.zip",
      enabled: true,
      managedByModList: true,
    },
    {
      name: "unmanaged",
      version: "1.0.0",
      filePath: "C:\\mods\\unmanaged_1.0.0.zip",
      managedByModList: false,
    },
    {
      name: "missing",
      version: "1.0.0",
      filePath: "C:\\mods\\missing_1.0.0.zip",
      enabled: true,
      managedByModList: true,
    },
  ];
  const queuedRequests: DownloadRequest[] = [];
  const upsertedEntries: ModListEntry[] = [];

  const result = await queueUpdateAllInstalled({
    settings,
    modsFolder: "C:\\mods",
    installed,
    getDetails: async (modName) => {
      if (modName === "outdated") {
        return { ...createDetails("1.1.0"), name: modName };
      }
      if (modName === "current") {
        return { ...createDetails("2.0.0"), name: modName };
      }
      throw new Error("Portal lookup failed");
    },
    upsertEntry: async (_settings, entry) => {
      upsertedEntries.push(entry);
    },
    enqueue: (request) => {
      queuedRequests.push(request);
    },
  });

  assert.deepEqual(result, {
    checkedCount: 4,
    queuedCount: 1,
    upToDateCount: 1,
    unavailableMods: [],
    unmanagedMods: ["unmanaged"],
    failedMods: [{ modName: "missing", error: "Portal lookup failed" }],
    queuedModNames: ["outdated"],
  });
  assert.deepEqual(upsertedEntries, [
    {
      name: "outdated",
      enabled: false,
      version: "1.1.0",
    },
  ]);
  assert.deepEqual(queuedRequests, [
    {
      modName: "outdated",
      version: "1.1.0",
      targetFolder: "C:\\mods",
      replaceExisting: true,
      existingFilePath: "C:\\mods\\outdated_1.0.0.zip",
    },
  ]);
});

test("queueUpdateAllInstalled returns an empty result when nothing is installed", async () => {
  const result = await queueUpdateAllInstalled({
    settings,
    modsFolder: "C:\\mods",
    installed: [],
    getDetails: async () => createDetails("1.0.0"),
    upsertEntry: async () => undefined,
    enqueue: () => undefined,
  });

  assert.deepEqual(result, {
    checkedCount: 0,
    queuedCount: 0,
    upToDateCount: 0,
    unavailableMods: [],
    unmanagedMods: [],
    failedMods: [],
    queuedModNames: [],
  });
});

test("queueUpdateAllInstalled records queue failures and continues with later mods", async () => {
  const installed: Array<
    Pick<
      InstalledMod,
      "name" | "version" | "filePath" | "enabled" | "managedByModList"
    >
  > = [
    {
      name: "first",
      version: "1.0.0",
      filePath: "C:\\mods\\first_1.0.0.zip",
      enabled: true,
      managedByModList: true,
    },
    {
      name: "second",
      version: "1.0.0",
      filePath: "C:\\mods\\second_1.0.0.zip",
      enabled: true,
      managedByModList: true,
    },
  ];

  const result = await queueUpdateAllInstalled({
    settings,
    modsFolder: "C:\\mods",
    installed,
    getDetails: async (modName) => ({
      ...createDetails("1.1.0"),
      name: modName,
    }),
    upsertEntry: async (_settings, entry) => {
      if (entry.name === "first") {
        throw new Error("disk full");
      }
    },
    enqueue: () => undefined,
  });

  assert.deepEqual(result, {
    checkedCount: 2,
    queuedCount: 1,
    upToDateCount: 0,
    unavailableMods: [],
    unmanagedMods: [],
    failedMods: [
      {
        modName: "first",
        error: "disk full",
      },
    ],
    queuedModNames: ["second"],
  });
});
