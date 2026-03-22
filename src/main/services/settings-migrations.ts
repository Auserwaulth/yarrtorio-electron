import { CURRENT_SETTINGS_VERSION } from "@shared/constants";
import type { AppSettings } from "@shared/types/mod";

export { CURRENT_SETTINGS_VERSION };

type SettingsMigration = {
  version: number;
  migrate: (settings: AppSettings) => AppSettings;
};

/**
 * NOTE:
 * Migrations array - each entry represents a version upgrade.
 *
 * Version 1 is the initial version. Settings without a version field
 * (i.e., version 0) are treated as "unversioned" and will be migrated
 * to version 1. Since version 1 is the starting point, no actual
 * transformation is needed - we simply ensure the version field is set.
 *
 * For future versions, add migrations like:
 * {
 *   version: 2,
 *   migrate: (settings) => ({
 *     ...settings,
 *     newField: "default value",
 *   }),
 * },
 */
const migrations: SettingsMigration[] = [];

export function migrateSettings(
  settings: AppSettings,
  fromVersion: number,
): AppSettings {
  let current = settings;
  let version = fromVersion;

  while (version < CURRENT_SETTINGS_VERSION) {
    const migration = migrations.find((m) => m.version === version + 1);
    if (migration) {
      current = migration.migrate(current);
      version = migration.version;
    } else {
      // No migration found, break to avoid infinite loop
      break;
    }
  }

  return current;
}

export function getMigrationVersion(settings: AppSettings): number {
  return settings.version ?? 0;
}
