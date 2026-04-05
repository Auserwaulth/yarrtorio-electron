import assert from "node:assert/strict";
import test from "node:test";
import { resolveDownloadPlan } from "./mod-download-plan.ts";
import type { ApiMod, ApiRelease } from "./portal/portal-types.ts";
import type { InstalledMod } from "../../shared/types/mod.ts";

function createRelease(
  version: string,
  dependencies: string[] = [],
): ApiRelease {
  return {
    version,
    released_at: "2026-01-01",
    download_url: `/${version}.zip`,
    file_name: `${version}.zip`,
    info_json: {
      dependencies,
    },
  };
}

function createMod(name: string, releases: ApiRelease[]): ApiMod {
  const mod: ApiMod = {
    name,
    title: name,
    owner: "owner",
    summary: name,
    releases,
  };

  const latestRelease = releases.at(-1);
  if (latestRelease) {
    mod.latest_release = latestRelease;
  }

  return mod;
}

function createInstalledMod(
  name: string,
  version: string,
  filePath: string,
): InstalledMod {
  return {
    name,
    version,
    fileName: `${name}_${version}.zip`,
    filePath,
    enabled: true,
    managedByModList: true,
  };
}

test("resolveDownloadPlan includes required dependencies once and replaces installed dependencies", async () => {
  const mods = new Map<string, ApiMod>([
    [
      "root",
      createMod("root", [createRelease("1.0.0", ["dep >= 1.0.0", "? helper"])]),
    ],
    ["dep", createMod("dep", [createRelease("2.0.0")])],
    ["helper", createMod("helper", [createRelease("3.0.0")])],
  ]);

  const requests = await resolveDownloadPlan(
    {
      modName: "root",
      version: "1.0.0",
      targetFolder: "C:\\mods",
      replaceExisting: false,
      includeDependencies: true,
    },
    {
      ensureAccessibleModsFolder: async (folder) => folder,
      listInstalledMods: async () => [
        createInstalledMod("dep", "1.5.0", "C:\\mods\\dep_1.5.0.zip"),
      ],
      resolvePathWithinFolder: (_folder, candidate) => candidate,
      fetchModFull: async (modName) => {
        const mod = mods.get(modName);
        if (!mod) {
          throw new Error(`Unknown mod ${modName}`);
        }
        return mod;
      },
    },
  );

  assert.deepEqual(requests, [
    {
      modName: "dep",
      version: "2.0.0",
      targetFolder: "C:\\mods",
      replaceExisting: true,
      existingFilePath: "C:\\mods\\dep_1.5.0.zip",
      includeDependencies: false,
    },
    {
      modName: "root",
      version: "1.0.0",
      targetFolder: "C:\\mods",
      replaceExisting: false,
    },
  ]);
});

test("resolveDownloadPlan deduplicates shared dependencies across the graph", async () => {
  const mods = new Map<string, ApiMod>([
    [
      "root",
      createMod("root", [
        createRelease("1.0.0", ["left >= 1.0.0", "right >= 1.0.0"]),
      ]),
    ],
    ["left", createMod("left", [createRelease("1.0.0", ["shared >= 1.0.0"])])],
    [
      "right",
      createMod("right", [createRelease("1.0.0", ["shared >= 1.0.0"])]),
    ],
    ["shared", createMod("shared", [createRelease("1.0.0")])],
  ]);

  const requests = await resolveDownloadPlan(
    {
      modName: "root",
      version: "1.0.0",
      targetFolder: "C:\\mods",
      replaceExisting: false,
      includeDependencies: true,
    },
    {
      ensureAccessibleModsFolder: async (folder) => folder,
      listInstalledMods: async () => [],
      resolvePathWithinFolder: (_folder, candidate) => candidate,
      fetchModFull: async (modName) => mods.get(modName)!,
    },
  );

  assert.deepEqual(
    requests.map((item) => `${item.modName}@${item.version}`),
    ["shared@1.0.0", "left@1.0.0", "right@1.0.0", "root@1.0.0"],
  );
});

test("resolveDownloadPlan validates and preserves the root existing file path", async () => {
  const seenPaths: Array<{ folder: string; candidate: string }> = [];

  const requests = await resolveDownloadPlan(
    {
      modName: "root",
      version: "1.0.0",
      targetFolder: "C:\\mods",
      replaceExisting: false,
      existingFilePath: "C:\\mods\\root_0.9.0.zip",
      includeDependencies: false,
    },
    {
      ensureAccessibleModsFolder: async (folder) => folder,
      listInstalledMods: async () => [],
      resolvePathWithinFolder: (folder, candidate) => {
        seenPaths.push({ folder, candidate });
        return candidate;
      },
      fetchModFull: async () => createMod("root", [createRelease("1.0.0")]),
    },
  );

  assert.deepEqual(seenPaths, [
    {
      folder: "C:\\mods",
      candidate: "C:\\mods\\root_0.9.0.zip",
    },
  ]);
  assert.deepEqual(requests, [
    {
      modName: "root",
      version: "1.0.0",
      targetFolder: "C:\\mods",
      replaceExisting: true,
      existingFilePath: "C:\\mods\\root_0.9.0.zip",
    },
  ]);
});

test("resolveDownloadPlan throws when the requested release does not exist", async () => {
  await assert.rejects(
    () =>
      resolveDownloadPlan(
        {
          modName: "root",
          version: "9.9.9",
          targetFolder: "C:\\mods",
          replaceExisting: false,
          includeDependencies: false,
        },
        {
          ensureAccessibleModsFolder: async (folder) => folder,
          listInstalledMods: async () => [],
          resolvePathWithinFolder: (_folder, candidate) => candidate,
          fetchModFull: async () => createMod("root", [createRelease("1.0.0")]),
        },
      ),
    /Release 9\.9\.9 for root was not found\./,
  );
});

test("resolveDownloadPlan throws when a required dependency has no downloadable release", async () => {
  await assert.rejects(
    () =>
      resolveDownloadPlan(
        {
          modName: "root",
          version: "1.0.0",
          targetFolder: "C:\\mods",
          replaceExisting: false,
          includeDependencies: true,
        },
        {
          ensureAccessibleModsFolder: async (folder) => folder,
          listInstalledMods: async () => [],
          resolvePathWithinFolder: (_folder, candidate) => candidate,
          fetchModFull: async (modName) =>
            modName === "root"
              ? createMod("root", [createRelease("1.0.0", ["dep >= 1.0.0"])])
              : createMod("dep", []),
        },
      ),
    /No downloadable release found for dependency dep\./,
  );
});
