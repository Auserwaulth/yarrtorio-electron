import electron from "electron";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { AppSettings } from "../../shared/types/mod.ts";
import {
  DEFAULT_DOWNLOAD_CONCURRENCY,
  SETTINGS_FILE_NAME,
} from "../../shared/constants/index.ts";
import { settingsSchema } from "../../shared/validation/schemas.ts";
import {
  CURRENT_SETTINGS_VERSION,
  getMigrationVersion,
  migrateSettings,
} from "./settings-migrations.ts";

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
  factorioPath: "",
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

function isMissingFileError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "ENOENT"
  );
}

async function preserveCorruptSettingsFile(filePath: string): Promise<void> {
  const backupPath = join(
    dirname(filePath),
    `settings.corrupt-${Date.now()}-${Math.random().toString(36).slice(2)}.json`,
  );

  await copyFile(filePath, backupPath).catch(() => undefined);
}

/**
 * Creates the persistent settings service used by the main process.
 *
 * Settings are read from the app's user-data directory, validated against the
 * shared schema, migrated in-memory when an older version is detected, and
 * saved back to disk after a successful migration. A missing file falls back
 * to defaults. An invalid existing file is preserved as a backup and reported
 * as an error instead of being silently reset.
 *
 * @returns Service methods for reading and saving validated app settings.
 */
export function createSettingsService(): SettingsService {
  const { app } = electron;
  const filePath = join(app.getPath("userData"), SETTINGS_FILE_NAME);

  async function getSettings(): Promise<AppSettings> {
    try {
      const raw = await readFile(filePath, "utf8");
      let data: unknown;

      try {
        data = JSON.parse(raw);
      } catch {
        await preserveCorruptSettingsFile(filePath);
        throw new Error(
          "Settings file is invalid. A backup copy was preserved.",
        );
      }

      let parsed: PersistedAppSettings;

      try {
        parsed = settingsSchema.parse(data) as PersistedAppSettings;
      } catch {
        await preserveCorruptSettingsFile(filePath);
        throw new Error(
          "Settings file is invalid. A backup copy was preserved.",
        );
      }

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
    } catch (error) {
      if (isMissingFileError(error)) {
        return defaults;
      }

      if (error instanceof Error) {
        throw error;
      }

      throw new Error("Failed to load settings file.");
    }
  }

  async function saveSettings(input: AppSettings): Promise<AppSettings> {
    const parsed = settingsSchema.parse({
      ...input,
      version: CURRENT_SETTINGS_VERSION,
    }) as PersistedAppSettings;
    const normalized = normalizeSettings(parsed);
    try {
      await mkdir(dirname(filePath), { recursive: true });
      await writeFile(filePath, JSON.stringify(normalized, null, 2), "utf8");
    } catch {
      throw new Error("Failed to save settings file.");
    }
    return normalized;
  }

  return { getSettings, saveSettings };
}
