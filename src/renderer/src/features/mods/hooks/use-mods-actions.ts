import { useRef, useState } from "react";
import { modsService } from "../services/mods-service";
import type {
  AppSettings,
  BrowseFilters,
  DownloadProgress,
  ModLibraryState,
  ModToggleImpact,
} from "@shared/types/mod";
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
  const [browseBusyCount, setBrowseBusyCount] = useState(0);
  const [installedBusyCount, setInstalledBusyCount] = useState(0);
  const [pendingInstalledModNames, setPendingInstalledModNames] = useState<
    string[]
  >([]);
  const browseBusy = browseBusyCount > 0;
  const installedBusy = installedBusyCount > 0;
  const latestBrowseRequestId = useRef(0);

  function reportError(message: string) {
    options.onError?.(message);
  }

  async function runWithBrowseBusy<T>(task: () => Promise<T>): Promise<T> {
    setBrowseBusyCount((current) => current + 1);

    try {
      return await task();
    } finally {
      setBrowseBusyCount((current) => Math.max(0, current - 1));
    }
  }

  async function runWithInstalledBusy<T>(task: () => Promise<T>): Promise<T> {
    setInstalledBusyCount((current) => current + 1);

    try {
      return await task();
    } finally {
      setInstalledBusyCount((current) => Math.max(0, current - 1));
    }
  }

  async function runWithPendingInstalledMods<T>(
    modNames: string[],
    task: () => Promise<T>,
  ): Promise<T> {
    const uniqueModNames = Array.from(new Set(modNames));
    setPendingInstalledModNames((current) =>
      Array.from(new Set([...current, ...uniqueModNames])),
    );

    try {
      return await task();
    } finally {
      setPendingInstalledModNames((current) =>
        current.filter((name) => !uniqueModNames.includes(name)),
      );
    }
  }

  function getNextLibraryState(
    currentState: ModLibraryState | undefined,
    nextState: ModLibraryState | undefined,
  ): ModLibraryState | undefined {
    if (nextState) {
      return nextState;
    }

    if (!currentState) {
      return undefined;
    }

    return {
      ...currentState,
      isInstalled: false,
      isInModList: false,
      isEnabledInModList: false,
    };
  }

  async function refreshInstalledConflicts(): Promise<void> {
    const result = await modsService.getInstalledConflicts();

    if (!result.ok) {
      reportError(result.error);
      return;
    }

    setStore((current) => ({
      ...current,
      installedConflicts: result.data,
    }));
  }

  async function applySettingsAndRefresh(
    result: { ok: true; data: AppSettings } | { ok: false; error: string },
    successMessage: string,
  ): Promise<void> {
    if (!result.ok) {
      reportError(result.error);
      return;
    }

    setStore((current) => ({ ...current, settings: result.data }));
    options.onSuccess?.(successMessage);
    await refreshInstalled();
  }

  async function browse(filters: BrowseFilters): Promise<void> {
    const requestId = latestBrowseRequestId.current + 1;
    latestBrowseRequestId.current = requestId;

    await runWithBrowseBusy(async () => {
      const result = await modsService.browse(filters);
      if (requestId !== latestBrowseRequestId.current) {
        return;
      }

      if (!result.ok) {
        reportError(result.error);
        return;
      }

      setStore((current) => ({
        ...current,
        mods: result.data.items,
        modsPagination: result.data.pagination,
      }));
    });
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

  async function refreshInstalled(trackBusy = false): Promise<void> {
    const refreshTask = async () => {
      const [installedResult, conflictsResult, libraryStateResult] =
        await Promise.all([
          modsService.installed(),
          modsService.getInstalledConflicts(),
          modsService.getLibraryState(),
        ]);

      if (installedResult.ok) {
        setStore((current) => ({
          ...current,
          installed: installedResult.data,
          installedConflicts: conflictsResult.ok ? conflictsResult.data : {},
          mods: current.mods.map((mod) => {
            const nextLibraryState = getNextLibraryState(
              mod.libraryState,
              libraryStateResult.ok
                ? libraryStateResult.data[mod.name]
                : undefined,
            );

            return nextLibraryState
              ? {
                  ...mod,
                  libraryState: nextLibraryState,
                }
              : mod;
          }),
          selectedMod: (() => {
            if (!current.selectedMod) {
              return null;
            }

            const nextLibraryState = getNextLibraryState(
              current.selectedMod.libraryState,
              libraryStateResult.ok
                ? libraryStateResult.data[current.selectedMod.name]
                : undefined,
            );

            return nextLibraryState
              ? {
                  ...current.selectedMod,
                  libraryState: nextLibraryState,
                }
              : current.selectedMod;
          })(),
        }));

        if (!conflictsResult.ok) {
          reportError(conflictsResult.error);
        }

        if (!libraryStateResult.ok) {
          reportError(libraryStateResult.error);
        }

        return;
      }

      reportError(installedResult.error);
      if (!conflictsResult.ok) {
        reportError(conflictsResult.error);
      }
      if (!libraryStateResult.ok) {
        reportError(libraryStateResult.error);
      }
    };

    if (trackBusy) {
      await runWithInstalledBusy(refreshTask);
      return;
    }

    await refreshTask();
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

    await runWithInstalledBusy(async () => {
      const result = await modsService.syncFromModList(includeDisabled);

      if (result.ok) {
        options.onSuccess?.(
          `Queued ${result.data.length} mod${result.data.length === 1 ? "" : "s"} from mod-list.`,
        );
        await refreshInstalled(true);
      } else {
        reportError(result.error);
      }
    });
  }

  async function deleteInstalled(
    modName: string,
    filePath: string,
  ): Promise<void> {
    await runWithPendingInstalledMods([modName], async () => {
      const result = await modsService.deleteInstalled(modName, filePath);
      if (result.ok) {
        options.onSuccess?.(`Deleted ${modName}.`);
        await refreshInstalled();
      } else {
        reportError(result.error);
      }
    });
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

    await runWithPendingInstalledMods([modName], async () => {
      const result = await modsService.queueUpdateInstalled(modName, filePath);
      if (result.ok) {
        options.onSuccess?.(`Queued update for ${modName}.`);
        await refreshInstalled();
      } else {
        reportError(result.error);
      }
    });
  }

  async function setEnabled(
    modName: string,
    enabled: boolean,
    relatedModNames: string[] = [],
  ): Promise<void> {
    let previousEnabled: boolean | undefined;

    setStore((current) => {
      previousEnabled = current.installed.find(
        (item) => item.name === modName,
      )?.enabled;

      return {
        ...current,
        installed: current.installed.map((item) =>
          item.name === modName ? { ...item, enabled } : item,
        ),
        mods: current.mods.map((mod) =>
          mod.name === modName && mod.libraryState
            ? {
                ...mod,
                libraryState: {
                  ...mod.libraryState,
                  isInModList: true,
                  isEnabledInModList: enabled,
                },
              }
            : mod,
        ),
        selectedMod:
          current.selectedMod?.name === modName &&
          current.selectedMod.libraryState
            ? {
                ...current.selectedMod,
                libraryState: {
                  ...current.selectedMod.libraryState,
                  isInModList: true,
                  isEnabledInModList: enabled,
                },
              }
            : current.selectedMod,
      };
    });

    await runWithPendingInstalledMods(
      [modName, ...relatedModNames],
      async () => {
      const result = await modsService.setEnabled(
        modName,
        enabled,
        relatedModNames,
      );
      if (result.ok) {
        options.onSuccess?.(
          `${enabled ? "Enabled" : "Disabled"} ${modName} in mod-list.`,
        );
        if (relatedModNames.length > 0) {
          await refreshInstalled();
        } else {
          await refreshInstalledConflicts();
        }
      } else {
        setStore((current) => ({
          ...current,
          installed: current.installed.map((item) =>
            item.name === modName
              ? previousEnabled === undefined
                ? (() => {
                    const nextItem = { ...item };
                    delete nextItem.enabled;
                    return nextItem;
                  })()
                : { ...item, enabled: previousEnabled }
              : item,
          ),
          mods: current.mods.map((mod) =>
            mod.name === modName && mod.libraryState
              ? {
                  ...mod,
                  libraryState: {
                    ...mod.libraryState,
                    isEnabledInModList:
                      previousEnabled ?? mod.libraryState.isEnabledInModList,
                  },
                }
              : mod,
          ),
          selectedMod:
            current.selectedMod?.name === modName &&
            current.selectedMod.libraryState
              ? {
                  ...current.selectedMod,
                  libraryState: {
                    ...current.selectedMod.libraryState,
                    isEnabledInModList:
                      previousEnabled ??
                      current.selectedMod.libraryState.isEnabledInModList,
                  },
                }
              : current.selectedMod,
        }));
        reportError(result.error);
        await refreshInstalledConflicts();
      }
      },
    );
  }

  async function getModToggleImpact(
    modName: string,
    enabled: boolean,
  ): Promise<ModToggleImpact | null> {
    const result = await modsService.getModToggleImpact(modName, enabled);

    if (!result.ok) {
      reportError(result.error);
      return null;
    }

    return result.data;
  }

  async function retryDownload(download: DownloadProgress): Promise<void> {
    const result = await modsService.retryDownload(download);
    if (!result.ok) {
      reportError(result.error);
    }
  }

  async function retryAllFailed(downloads: DownloadProgress[]): Promise<void> {
    const failedDownloads = downloads.filter((d) => d.state === "failed");
    await Promise.all(
      failedDownloads.map((download) => retryDownload(download)),
    );
  }

  async function fetchLatestVersions(): Promise<number> {
    return runWithInstalledBusy(async () => {
      const result = await modsService.getLatestVersions();
      let updateCount = 0;
      if (result.ok) {
        setStore((current) => {
          updateCount = current.installed.filter(
            (mod) =>
              result.data[mod.name] && result.data[mod.name] !== mod.version,
          ).length;
          return {
            ...current,
            latestVersions: result.data,
          };
        });
      }
      return updateCount;
    });
  }

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

  return {
    browse,
    selectMod,
    refreshInstalled,
    queueSelectedMod,
    syncFromModList,
    deleteInstalled,
    queueUpdateInstalled,
    getModToggleImpact,
    setEnabled,
    retryDownload,
    retryAllFailed,
    fetchLatestVersions,
    createModListProfile,
    renameModListProfile,
    switchModListProfile,
    removeModListProfile,
    browseBusy,
    installedBusy,
    pendingInstalledModNames,
  };
}
