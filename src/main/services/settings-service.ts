import { app } from "electron";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import {
  DEFAULT_DOWNLOAD_CONCURRENCY,
  SETTINGS_FILE_NAME,
} from "@shared/constants";
import { settingsSchema } from "@shared/validation/schemas";
import type { AppSettings } from "@shared/types/mod";
import {
  CURRENT_SETTINGS_VERSION,
  getMigrationVersion,
  migrateSettings,
} from "./settings-migrations";

type PersistedAppSettings = AppSettings & {
  modListPath?: string;
};

export interface SettingsService {
  getSettings(): Promise<AppSettings>;
  saveSettings(input: AppSettings): Promise<AppSettings>;
}

const defaults: AppSettings = {
  version: CURRENT_SETTINGS_VERSION,
  modsFolder: "",
  modListProfiles: [
    {
      id: "default",
      name: "Default",
    },
  ],
  activeModListProfileId: "default",
  snackbarPosition: "bottom-right",
  concurrency: DEFAULT_DOWNLOAD_CONCURRENCY,
  ignoreDisabledMods: true,
  includeDisabledModsByDefault: false,
  desktopNotifications: true,
  theme: "system",
};

function normalizeSettings(input: PersistedAppSettings): AppSettings {
  const settings = { ...input };
  delete settings.modListPath;
  return settings;
}

/**
 * Creates the persistent settings service used by the main process.
 *
 * Settings are read from the app's user-data directory, validated against the
 * shared schema, migrated in-memory when an older version is detected, and
 * saved back to disk after a successful migration. If the file is missing or
 * unreadable, the current defaults are returned.
 *
 * @returns Service methods for reading and saving validated app settings.
 */
export function createSettingsService(): SettingsService {
  const filePath = join(app.getPath("userData"), SETTINGS_FILE_NAME);

  async function getSettings(): Promise<AppSettings> {
    try {
      const raw = await readFile(filePath, "utf8");
      const parsed = settingsSchema.parse(
        JSON.parse(raw),
      ) as PersistedAppSettings;

      // Apply migrations if needed
      const savedVersion = getMigrationVersion(parsed);
      if (savedVersion < CURRENT_SETTINGS_VERSION) {
        const migrated = migrateSettings(parsed, savedVersion);
        // Validate migrated settings against schema
        const validated = settingsSchema.parse(
          migrated,
        ) as PersistedAppSettings;
        const normalized = normalizeSettings(validated);
        // Save migrated settings
        try {
          await mkdir(dirname(filePath), { recursive: true });
          await writeFile(
            filePath,
            JSON.stringify(normalized, null, 2),
            "utf8",
          );
        } catch (writeErr) {
          // Log error but return migrated settings in memory
          console.error("Failed to save migrated settings:", writeErr);
        }
        return normalized;
      }

      return normalizeSettings(parsed);
    } catch {
      return defaults;
    }
  }

  async function saveSettings(input: AppSettings): Promise<AppSettings> {
    const parsed = settingsSchema.parse({
      ...input,
      version: CURRENT_SETTINGS_VERSION,
    }) as PersistedAppSettings;
    const normalized = normalizeSettings(parsed);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify(normalized, null, 2), "utf8");
    return normalized;
  }

  return { getSettings, saveSettings };
}
