import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";
import { createProfileHandlers } from "./profile-handlers.ts";
import type { AppSettings } from "../../../../shared/types/mod.ts";

function createSettings(): AppSettings {
  return {
    version: 2,
    modsFolder: "C:\\Factorio\\mods",
    factorioPath: "C:\\Factorio\\bin\\x64\\factorio.exe",
    modListProfiles: [{ id: "default", name: "Default" }],
    activeModListProfileId: "default",
    snackbarPosition: "bottom-right",
    concurrency: 3,
    ignoreDisabledMods: true,
    includeDisabledModsByDefault: false,
    desktopNotifications: true,
    theme: "system",
  };
}

function createSettingsService() {
  return {
    getSettings: async () => createSettings(),
    saveSettings: async (next: AppSettings) => next,
  };
}

test("importModListProfile returns cancelled when the picker is closed", async () => {
  const handlers = createProfileHandlers(createSettingsService(), {
    showOpenDialog: async () => ({ canceled: true, filePaths: [] }),
    showSaveDialog: async () => ({ canceled: true, filePath: "" }),
  });

  const result = await handlers.importModListProfile();

  assert.deepEqual(result, {
    ok: false,
    error: "Profile import cancelled.",
  });
});

test("exportModListProfile returns cancelled when the save dialog is closed", async () => {
  const handlers = createProfileHandlers(createSettingsService(), {
    showOpenDialog: async () => ({ canceled: true, filePaths: [] }),
    showSaveDialog: async () => ({ canceled: true, filePath: "" }),
  });

  const result = await handlers.exportModListProfile(null as never, {
    profileId: "default",
  });

  assert.deepEqual(result, {
    ok: false,
    error: "Profile export cancelled.",
  });
});

test("importModListProfile rejects invalid exported files before writing state", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "yarrtorio-profile-import-"));
  const filePath = join(workspace, "invalid.json");

  try {
    await writeFile(filePath, "{ not valid json", "utf8");

    const handlers = createProfileHandlers(createSettingsService(), {
      showOpenDialog: async () => ({
        canceled: false,
        filePaths: [filePath],
      }),
      showSaveDialog: async () => ({ canceled: true, filePath: "" }),
    });

    const result = await handlers.importModListProfile();

    assert.deepEqual(result, {
      ok: false,
      error: "Selected file is not a valid mod-list profile export.",
    });
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("exportModListProfile writes the selected profile and returns a summary", async () => {
  let parsedProfileId: string | null = null;
  let writtenExport:
    | {
        filePath: string;
        profileName: string;
        mods: Array<{ name: string; enabled: boolean }>;
      }
    | null = null;

  const handlers = createProfileHandlers(createSettingsService(), {
    showOpenDialog: async () => ({ canceled: true, filePaths: [] }),
    showSaveDialog: async () => ({
      canceled: false,
      filePath: "C:\\exports\\default.yarrtorio-profile.json",
    }),
    parseProfileMods: async (profileId) => {
      parsedProfileId = profileId;
      return [
        { name: "base", enabled: true },
        { name: "alpha", enabled: true },
      ];
    },
    writeExportPackage: async (filePath, profileName, mods) => {
      writtenExport = {
        filePath,
        profileName,
        mods,
      };
    },
  });

  const result = await handlers.exportModListProfile(null as never, {
    profileId: "default",
  });

  assert.equal(parsedProfileId, "default");
  assert.deepEqual(writtenExport, {
    filePath: "C:\\exports\\default.yarrtorio-profile.json",
    profileName: "Default",
    mods: [
      { name: "base", enabled: true },
      { name: "alpha", enabled: true },
    ],
  });
  assert.deepEqual(result, {
    ok: true,
    data: {
      profileName: "Default",
      filePath: "C:\\exports\\default.yarrtorio-profile.json",
      modCount: 2,
    },
  });
});

test("importModListProfile keeps duplicate names unique and preserves the active profile", async () => {
  const settings = createSettings();
  settings.modListProfiles = [
    { id: "default", name: "Default" },
    { id: "existing", name: "Imported" },
  ];

  let savedSettings: AppSettings | null = null;
  let writtenStorage:
    | {
        profileId: string;
        mods: Array<{ name: string; enabled: boolean }>;
      }
    | null = null;
  let deletedProfileId: string | null = null;

  const handlers = createProfileHandlers(
    {
      getSettings: async () => settings,
      saveSettings: async (next: AppSettings) => {
        savedSettings = next;
        return next;
      },
    },
    {
      showOpenDialog: async () => ({
        canceled: false,
        filePaths: ["C:\\imports\\profile.json"],
      }),
      showSaveDialog: async () => ({ canceled: true, filePath: "" }),
      createProfileId: () => "imported-profile",
      readExportPackage: async () => ({
        version: 1,
        profile: { name: "Imported" },
        mods: [
          { name: "base", enabled: true },
          { name: "alpha", enabled: true },
        ],
      }),
      writeProfileStorage: async (profileId, mods) => {
        writtenStorage = { profileId, mods };
      },
      deleteProfileStorage: async (profileId) => {
        deletedProfileId = profileId;
      },
    },
  );

  const result = await handlers.importModListProfile();

  assert.deepEqual(writtenStorage, {
    profileId: "imported-profile",
    mods: [
      { name: "base", enabled: true },
      { name: "alpha", enabled: true },
    ],
  });
  assert.equal(deletedProfileId, null);
  assert.equal(result.ok, true);
  if (!result.ok) {
    return;
  }

  assert.deepEqual(result.data.settings.modListProfiles, [
    { id: "default", name: "Default" },
    { id: "existing", name: "Imported" },
    { id: "imported-profile", name: "Imported (2)" },
  ]);
  assert.equal(result.data.settings.activeModListProfileId, "default");
  assert.deepEqual(savedSettings, result.data.settings);
  assert.deepEqual(result, {
    ok: true,
    data: {
      importedProfile: {
        id: "imported-profile",
        name: "Imported (2)",
      },
      settings: savedSettings,
      modCount: 2,
    },
  });
});

test("importModListProfile rolls back profile storage when saving settings fails", async () => {
  const deletedProfileIds: string[] = [];

  const handlers = createProfileHandlers(
    {
      getSettings: async () => createSettings(),
      saveSettings: async () => {
        throw new Error("save failed");
      },
    },
    {
      showOpenDialog: async () => ({
        canceled: false,
        filePaths: ["C:\\imports\\profile.json"],
      }),
      showSaveDialog: async () => ({ canceled: true, filePath: "" }),
      createProfileId: () => "imported-profile",
      readExportPackage: async () => ({
        version: 1,
        profile: { name: "Imported" },
        mods: [{ name: "base", enabled: true }],
      }),
      writeProfileStorage: async () => undefined,
      deleteProfileStorage: async (profileId) => {
        deletedProfileIds.push(profileId);
      },
    },
  );

  await assert.rejects(() => handlers.importModListProfile(), /save failed/);
  assert.deepEqual(deletedProfileIds, ["imported-profile"]);
});
