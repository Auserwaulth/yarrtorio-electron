import { app } from "electron";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import {
  DEFAULT_DOWNLOAD_CONCURRENCY,
  SETTINGS_FILE_NAME,
} from "@shared/constants";
import { settingsSchema } from "@shared/validation/schemas";
import type { AppSettings } from "@shared/types/mod";

export interface SettingsService {
  getSettings(): Promise<AppSettings>;
  saveSettings(input: AppSettings): Promise<AppSettings>;
}

const defaults: AppSettings = {
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
      return settingsSchema.parse(JSON.parse(raw));
    } catch {
      return defaults;
    }
  }

  async function saveSettings(input: AppSettings): Promise<AppSettings> {
    const parsed = settingsSchema.parse(input);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify(parsed, null, 2), "utf8");
    return parsed;
  }

  return { getSettings, saveSettings };
}
