import { useState } from "react";
import { settingsService } from "../services/settings-service";
import type { AppStore } from "../../../store/app-store";
import type { AppSettings } from "@shared/types/mod";
import { applyTheme } from "../../../utils/theme";

interface SettingsActionOptions {
  onError?(message: string): void;
  onSuccess?(message: string): void;
}

export function useSettingsActions(
  setStore: React.Dispatch<React.SetStateAction<AppStore>>,
  options: SettingsActionOptions = {},
) {
  const [saving, setSaving] = useState(false);

  async function save(settings: AppSettings): Promise<void> {
    setSaving(true);
    const result = await settingsService.update(settings);
    if (result.ok) {
      setStore((current) => ({ ...current, settings: result.data }));
      applyTheme(result.data.theme);
      options.onSuccess?.("Settings saved locally.");
    } else {
      options.onError?.(result.error);
    }
    setSaving(false);
  }

  async function chooseFolder(): Promise<string | null> {
    const result = await settingsService.chooseFolder();
    if (!result.ok && !result.error.toLowerCase().includes("cancelled")) {
      options.onError?.(result.error);
    }
    return result.ok ? result.data : null;
  }

  async function chooseModListFile(): Promise<string | null> {
    const result = await settingsService.chooseModListFile();
    if (!result.ok && !result.error.toLowerCase().includes("cancelled")) {
      options.onError?.(result.error);
    }
    return result.ok ? result.data : null;
  }

  return { save, chooseFolder, chooseModListFile, saving };
}
