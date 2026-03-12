import { DEFAULT_DOWNLOAD_CONCURRENCY } from "@shared/constants";
import type { AppSettings } from "@shared/types/mod";

export const defaultSettings: AppSettings = {
  modsFolder: "",
  modListPath: "",
  snackbarPosition: "bottom-right",
  concurrency: DEFAULT_DOWNLOAD_CONCURRENCY,
  ignoreDisabledMods: true,
  includeDisabledModsByDefault: false,
  desktopNotifications: true,
  theme: "dark",
};
