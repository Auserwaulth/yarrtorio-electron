import {
  CURRENT_SETTINGS_VERSION,
  DEFAULT_DOWNLOAD_CONCURRENCY,
} from "@shared/constants";
import type { AppSettings } from "@shared/types/mod";

export const defaultSettings: AppSettings = {
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
  theme: "dark",
};
