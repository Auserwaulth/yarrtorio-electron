import type { AppSettings } from "@shared/types/mod";

export const settingsService = {
  get: () => window.electronApi.settings.get(),
  update: (settings: AppSettings) =>
    window.electronApi.settings.update(settings),
  chooseFolder: () => window.electronApi.settings.chooseFolder(),
  chooseModListFile: () => window.electronApi.settings.chooseModListFile(),
};
