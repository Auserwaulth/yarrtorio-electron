import { useState } from "react";
import { modsService } from "../services/mods-service";
import type { BrowseFilters, DownloadProgress } from "@shared/types/mod";
import type { AppStore } from "../../../store/app-store";

interface ModsActionOptions {
  onInfo?(message: string): void;
  onError?(message: string): void;
  onSuccess?(message: string): void;
}

export function useModsActions(
  setStore: React.Dispatch<React.SetStateAction<AppStore>>,
  modsFolder: string,
  options: ModsActionOptions = {},
) {
  const [busy, setBusy] = useState(false);

  function reportError(message: string) {
    options.onError?.(message);
  }

  async function browse(filters: BrowseFilters): Promise<void> {
    setBusy(true);

    const result = await modsService.browse(filters);
    if (!result.ok) {
      reportError(result.error);
      setBusy(false);
      return;
    }

    setStore((current) => ({
      ...current,
      mods: result.data.items,
      modsPagination: result.data.pagination,
    }));

    setBusy(false);
  }

  async function selectMod(modName: string): Promise<void> {
    // Immediately open modal with loading state
    setStore((current) => ({
      ...current,
      selectedModPendingName: modName,
      selectedModLoading: true,
    }));

    const result = await modsService.details(modName);
    if (result.ok) {
      setStore((current) => ({
        ...current,
        selectedMod: result.data,
        selectedModLoading: false,
      }));
      return;
    }

    // On error, close the modal and report error
    setStore((current) => ({
      ...current,
      selectedModPendingName: null,
      selectedModLoading: false,
    }));
    reportError(result.error);
  }

  async function refreshInstalled(): Promise<void> {
    const result = await modsService.installed();
    if (result.ok) {
      const installedNames = new Set(result.data.map((item) => item.name));

      setStore((current) => ({
        ...current,
        installed: result.data,
        mods: current.mods.map((mod) =>
          mod.libraryState
            ? {
                ...mod,
                libraryState: {
                  ...mod.libraryState,
                  isInstalled: installedNames.has(mod.name),
                },
              }
            : mod,
        ),
        selectedMod: current.selectedMod
          ? current.selectedMod.libraryState
            ? {
                ...current.selectedMod,
                libraryState: {
                  ...current.selectedMod.libraryState,
                  isInstalled: installedNames.has(current.selectedMod.name),
                },
              }
            : current.selectedMod
          : null,
      }));

      return;
    }

    reportError(result.error);
  }

  async function queueSelectedMod(
    modName: string,
    version: string,
    existingFilePath?: string,
    includeDependencies = false,
  ): Promise<void> {
    if (!modsFolder.trim()) {
      options.onInfo?.(
        "Set your mods folder in Settings before downloading or syncing mods.",
      );
      return;
    }

    const result = await modsService.enqueueDownload({
      modName,
      version,
      targetFolder: modsFolder,
      replaceExisting: existingFilePath !== undefined,
      ...(existingFilePath !== undefined ? { existingFilePath } : {}),
      includeDependencies,
    });

    if (!result.ok) {
      reportError(result.error);
    }
  }

  async function syncFromModList(includeDisabled: boolean): Promise<void> {
    if (!modsFolder.trim()) {
      options.onInfo?.(
        "Set your mods folder in Settings before syncing from mod-list.",
      );
      return;
    }

    setBusy(true);
    const result = await modsService.syncFromModList(includeDisabled);

    if (result.ok) {
      options.onSuccess?.(
        `Queued ${result.data.length} mod${result.data.length === 1 ? "" : "s"} from mod-list.`,
      );
      await refreshInstalled();
    } else {
      reportError(result.error);
    }

    setBusy(false);
  }

  async function deleteInstalled(
    modName: string,
    filePath: string,
  ): Promise<void> {
    setBusy(true);
    const result = await modsService.deleteInstalled(modName, filePath);
    if (result.ok) {
      options.onSuccess?.(`Deleted ${modName}.`);
      await refreshInstalled();
    } else {
      reportError(result.error);
    }
    setBusy(false);
  }

  async function queueUpdateInstalled(
    modName: string,
    filePath: string,
  ): Promise<void> {
    if (!modsFolder.trim()) {
      options.onInfo?.(
        "Set your mods folder in Settings before updating installed mods.",
      );
      return;
    }

    setBusy(true);
    const result = await modsService.queueUpdateInstalled(modName, filePath);
    if (result.ok) {
      options.onSuccess?.(`Queued update for ${modName}.`);
      await refreshInstalled();
    } else {
      reportError(result.error);
    }
    setBusy(false);
  }

  async function setEnabled(modName: string, enabled: boolean): Promise<void> {
    setBusy(true);
    const result = await modsService.setEnabled(modName, enabled);
    if (result.ok) {
      options.onSuccess?.(
        `${enabled ? "Enabled" : "Disabled"} ${modName} in mod-list.`,
      );
      await refreshInstalled();
    } else {
      reportError(result.error);
    }
    setBusy(false);
  }

  async function retryDownload(download: DownloadProgress): Promise<void> {
    const result = await modsService.retryDownload(download);
    if (!result.ok) {
      reportError(result.error);
    }
  }

  async function retryAllFailed(downloads: DownloadProgress[]): Promise<void> {
    const failedDownloads = downloads.filter((d) => d.state === "failed");
    for (const download of failedDownloads) {
      await retryDownload(download);
    }
  }

  async function fetchLatestVersions(): Promise<void> {
    const result = await modsService.getLatestVersions();
    if (result.ok) {
      setStore((current) => ({
        ...current,
        latestVersions: result.data,
      }));
    }
  }

  return {
    browse,
    selectMod,
    refreshInstalled,
    queueSelectedMod,
    syncFromModList,
    deleteInstalled,
    queueUpdateInstalled,
    setEnabled,
    retryDownload,
    retryAllFailed,
    fetchLatestVersions,
    busy,
  };
}
