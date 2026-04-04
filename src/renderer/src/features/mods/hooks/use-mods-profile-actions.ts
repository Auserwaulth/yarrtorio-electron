import { modsService } from "../services/mods-service";
import type {
  ModsActionRuntime,
  SettingsResult,
} from "./use-mods-action-types";

interface ProfileActionDeps {
  runtime: ModsActionRuntime;
  applySettingsAndRefresh(
    result: SettingsResult,
    successMessage: string,
  ): Promise<void>;
  refreshInstalled(trackBusy?: boolean): Promise<void>;
}

export function useModsProfileActions({
  runtime,
  applySettingsAndRefresh,
  refreshInstalled,
}: ProfileActionDeps) {
  const { options, reportError, runWithInstalledBusy, setStore } = runtime;

  async function createModListProfile(name: string): Promise<void> {
    await runWithInstalledBusy(async () => {
      await applySettingsAndRefresh(
        await modsService.createModListProfile(name),
        `Created mod-list profile ${name}.`,
      );
    });
  }

  async function renameModListProfile(
    profileId: string,
    name: string,
  ): Promise<void> {
    await runWithInstalledBusy(async () => {
      await applySettingsAndRefresh(
        await modsService.renameModListProfile(profileId, name),
        "Renamed mod-list profile.",
      );
    });
  }

  async function switchModListProfile(profileId: string): Promise<void> {
    await runWithInstalledBusy(async () => {
      const result = await modsService.switchModListProfile(profileId);

      if (!result.ok) {
        reportError(result.error);
        return;
      }

      setStore((current) => ({ ...current, settings: result.data }));
      await refreshInstalled(true);
      options.onSuccess?.("Switched active mod-list profile.");
    });
  }

  async function removeModListProfile(profileId: string): Promise<void> {
    await runWithInstalledBusy(async () => {
      await applySettingsAndRefresh(
        await modsService.removeModListProfile(profileId),
        "Removed mod-list profile.",
      );
    });
  }

  async function exportModListProfile(profileId: string): Promise<void> {
    await runWithInstalledBusy(async () => {
      const result = await modsService.exportModListProfile(profileId);

      if (!result.ok) {
        if (result.error.toLowerCase().includes("cancelled")) {
          options.onInfo?.("Profile export cancelled.");
          return;
        }

        reportError(result.error);
        return;
      }

      options.onSuccess?.(
        `Exported ${result.data.profileName} (${result.data.modCount} mods).`,
      );
    });
  }

  async function importModListProfile(): Promise<void> {
    await runWithInstalledBusy(async () => {
      const result = await modsService.importModListProfile();

      if (!result.ok) {
        if (result.error.toLowerCase().includes("cancelled")) {
          options.onInfo?.("Profile import cancelled.");
          return;
        }

        reportError(result.error);
        return;
      }

      setStore((current) => ({ ...current, settings: result.data.settings }));
      options.onSuccess?.(
        `Imported ${result.data.importedProfile.name} (${result.data.modCount} mods).`,
      );
    });
  }

  return {
    createModListProfile,
    exportModListProfile,
    importModListProfile,
    removeModListProfile,
    renameModListProfile,
    switchModListProfile,
  };
}
