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

export interface SettingsService {
  getSettings(): Promise<AppSettings>;
  saveSettings(input: AppSettings): Promise<AppSettings>;
}

const defaults: AppSettings = {
  version: CURRENT_SETTINGS_VERSION,
  modsFolder: "",
  modListPath: "",
  snackbarPosition: "bottom-right",
  concurrency: DEFAULT_DOWNLOAD_CONCURRENCY,
  ignoreDisabledMods: true,
  includeDisabledModsByDefault: false,
  desktopNotifications: true,
  theme: "system",
};

export function createSettingsService(): SettingsService {
  const filePath = join(app.getPath("userData"), SETTINGS_FILE_NAME);

  async function getSettings(): Promise<AppSettings> {
    try {
      const raw = await readFile(filePath, "utf8");
      const parsed = settingsSchema.parse(JSON.parse(raw));

      // Apply migrations if needed
      const savedVersion = getMigrationVersion(parsed);
      if (savedVersion < CURRENT_SETTINGS_VERSION) {
        const migrated = migrateSettings(parsed, savedVersion);
        // Validate migrated settings against schema
        const validated = settingsSchema.parse(migrated);
        // Save migrated settings
        try {
          await mkdir(dirname(filePath), { recursive: true });
          await writeFile(filePath, JSON.stringify(validated, null, 2), "utf8");
        } catch (writeErr) {
          // Log error but return migrated settings in memory
          console.error("Failed to save migrated settings:", writeErr);
        }
        return validated;
      }

      return parsed;
    } catch {
      return defaults;
    }
  }

  async function saveSettings(input: AppSettings): Promise<AppSettings> {
    const parsed = settingsSchema.parse({
      ...input,
      version: CURRENT_SETTINGS_VERSION,
    });
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify(parsed, null, 2), "utf8");
    return parsed;
  }

  return { getSettings, saveSettings };
}
