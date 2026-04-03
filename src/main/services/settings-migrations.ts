import { CURRENT_SETTINGS_VERSION } from "../../shared/constants/index.ts";
import type { AppSettings } from "../../shared/types/mod.ts";

export { CURRENT_SETTINGS_VERSION };

type PersistedAppSettings = AppSettings & {
  modListPath?: string;
};

type MigratableSettings = Omit<PersistedAppSettings, "version"> & {
  version?: PersistedAppSettings["version"];
};

type SettingsMigration = {
  version: number;
  migrate: (settings: MigratableSettings) => PersistedAppSettings;
};

/**
 * NOTE:
 * Migrations array - each entry represents a version upgrade.
 *
 * Settings migration is only needed when older persisted data must be
 * transformed to preserve behavior or match a new contract. If a new settings
 * field is safely handled by schema defaults, a dedicated migration is usually
 * not necessary.
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
const migrations: SettingsMigration[] = [
  {
    version: 1,
    migrate: (settings) => ({
      ...settings,
      version: 1,
    }),
  },
  {
    version: 2,
    migrate: (settings) => {
      const existingProfiles =
        settings.modListProfiles?.filter(
          (profile) => profile.id && profile.name,
        ) ?? [];
      const profiles =
        existingProfiles.length > 0
          ? existingProfiles
          : [
              {
                id: "default",
                name: "Default",
              },
            ];
      const activeId = profiles.some(
        (profile) => profile.id === settings.activeModListProfileId,
      )
        ? settings.activeModListProfileId
        : (profiles[0]?.id ?? "default");

      return {
        ...settings,
        version: 2,
        modListProfiles: profiles,
        activeModListProfileId: activeId,
      };
    },
  },
];

/**
 * Applies sequential settings migrations until the current schema version is
 * reached or no matching migration exists.
 *
 * @param settings - Persisted settings loaded from disk.
 * @param fromVersion - Detected version of the persisted settings payload.
 * @returns Migrated settings object, potentially partially migrated when a
 * version gap has no registered migration.
 */
export function migrateSettings(
  settings: MigratableSettings,
  fromVersion: number,
): PersistedAppSettings {
  let current: MigratableSettings = settings;
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

  return current as PersistedAppSettings;
}

/**
 * Normalizes the stored settings version, treating legacy versionless payloads
 * as version `0`.
 *
 * @param settings - Persisted settings payload or subset containing `version`.
 * @returns Numeric version used to decide which migrations to run.
 */
export function getMigrationVersion(
  settings: Pick<MigratableSettings, "version">,
): number {
  return settings.version ?? 0;
}
