import test from "node:test";
import assert from "node:assert/strict";
import {
  CURRENT_SETTINGS_VERSION,
  getMigrationVersion,
  migrateSettings,
} from "./settings-migrations.ts";

test("versionless settings migrate through v1 and v2 to the current version", () => {
  const legacySettings = {
    modsFolder: "C:/Factorio/mods",
    factorioPath: "C:/Factorio/bin/x64/factorio.exe",
    modListProfiles: [],
    activeModListProfileId: "missing",
    snackbarPosition: "bottom-right" as const,
    concurrency: 3,
    ignoreDisabledMods: true,
    includeDisabledModsByDefault: false,
    desktopNotifications: true,
    theme: "system" as const,
  };

  const migrated = migrateSettings(
    legacySettings,
    getMigrationVersion({}),
  );

  assert.equal(migrated.version, CURRENT_SETTINGS_VERSION);
  assert.deepEqual(migrated.modListProfiles, [
    { id: "default", name: "Default" },
  ]);
  assert.equal(migrated.activeModListProfileId, "default");
});
