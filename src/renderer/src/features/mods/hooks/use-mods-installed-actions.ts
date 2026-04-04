import type {
  DownloadProgress,
  ModListProfileComparison,
  SyncFromModListPreview,
  ModToggleImpact,
} from "@shared/types/mod";
import { modsService } from "../services/mods-service";
import {
  getNextLibraryState,
  type ModsActionRuntime,
  type SettingsResult,
} from "./use-mods-action-types";

interface InstalledActionDeps {
  runtime: ModsActionRuntime;
  applySettingsAndRefresh(
    result: SettingsResult,
    successMessage: string,
  ): Promise<void>;
}

export function useModsInstalledActions({
  runtime,
  applySettingsAndRefresh,
}: InstalledActionDeps) {
  const {
    formatModNameList,
    modsFolder,
    options,
    reportError,
    runWithInstalledBusy,
    runWithPendingInstalledMods,
    setStore,
  } = runtime;

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
              ? { ...mod, libraryState: nextLibraryState }
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

  async function previewSyncFromModList(
    includeDisabled: boolean,
  ): Promise<SyncFromModListPreview | null> {
    if (!modsFolder.trim()) {
      options.onInfo?.(
        "Set your mods folder in Settings before syncing from mod-list.",
      );
      return null;
    }

    const result = await modsService.previewSyncFromModList(includeDisabled);

    if (!result.ok) {
      reportError(result.error);
      return null;
    }

    return result.data;
  }

  async function deleteInstalled(
    modName: string,
    fileName: string,
  ): Promise<void> {
    await runWithPendingInstalledMods([modName], async () => {
      const result = await modsService.deleteInstalled(modName, fileName);
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
    fileName: string,
  ): Promise<void> {
    if (!modsFolder.trim()) {
      options.onInfo?.(
        "Set your mods folder in Settings before updating installed mods.",
      );
      return;
    }

    await runWithPendingInstalledMods([modName], async () => {
      const result = await modsService.queueUpdateInstalled(modName, fileName);
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

  async function queueUpdateAllInstalled(): Promise<void> {
    if (!modsFolder.trim()) {
      options.onInfo?.(
        "Set your mods folder in Settings before updating installed mods.",
      );
      return;
    }

    await runWithInstalledBusy(async () => {
      const result = await modsService.queueUpdateAllInstalled();

      if (!result.ok) {
        reportError(result.error);
        return;
      }

      const {
        checkedCount,
        queuedCount,
        upToDateCount,
        unavailableMods,
        unmanagedMods,
        failedMods,
      } = result.data;

      await refreshInstalled(true);

      if (queuedCount > 0) {
        options.onSuccess?.(
          `Queued updates for ${queuedCount} mod${queuedCount === 1 ? "" : "s"}.`,
        );
      }

      if (unavailableMods.length > 0) {
        options.onInfo?.(
          `Could not resolve updates for ${formatModNameList(unavailableMods)}.`,
        );
      }

      if (unmanagedMods.length > 0) {
        options.onInfo?.(
          `Skipped unmanaged mods: ${formatModNameList(unmanagedMods)}.`,
        );
      }

      if (failedMods.length > 0) {
        reportError(
          `Failed to update ${formatModNameList(
            failedMods.map((failure) => failure.modName),
          )}.`,
        );
      }

      if (
        queuedCount === 0 &&
        unavailableMods.length === 0 &&
        unmanagedMods.length === 0 &&
        failedMods.length === 0
      ) {
        options.onInfo?.(
          checkedCount === 0
            ? "No installed mods are available to update."
            : upToDateCount === checkedCount
              ? "All installed mods are already up to date."
              : "No installed mods were queued for update.",
        );
      }
    });
  }

  async function bulkDeleteInstalled(
    entries: Array<{ modName: string; fileName: string }>,
  ): Promise<void> {
    if (entries.length === 0) {
      return;
    }

    const uniqueEntries = Array.from(
      new Map(
        entries.map((entry) => [`${entry.modName}:${entry.fileName}`, entry]),
      ).values(),
    );

    await runWithPendingInstalledMods(
      uniqueEntries.map((entry) => entry.modName),
      async () => {
        const deletedModNames: string[] = [];
        const failedModNames: string[] = [];

        for (const entry of uniqueEntries) {
          const result = await modsService.deleteInstalled(
            entry.modName,
            entry.fileName,
          );

          if (result.ok) {
            deletedModNames.push(entry.modName);
          } else {
            failedModNames.push(entry.modName);
          }
        }

        await refreshInstalled();

        if (deletedModNames.length > 0) {
          options.onSuccess?.(
            `Deleted ${deletedModNames.length} mod${deletedModNames.length === 1 ? "" : "s"}.`,
          );
        }

        if (failedModNames.length > 0) {
          reportError(`Failed to delete ${formatModNameList(failedModNames)}.`);
        }
      },
    );
  }

  async function bulkQueueUpdateInstalled(
    entries: Array<{ modName: string; fileName: string }>,
  ): Promise<void> {
    if (!modsFolder.trim()) {
      options.onInfo?.(
        "Set your mods folder in Settings before updating installed mods.",
      );
      return;
    }

    if (entries.length === 0) {
      return;
    }

    const uniqueEntries = Array.from(
      new Map(
        entries.map((entry) => [`${entry.modName}:${entry.fileName}`, entry]),
      ).values(),
    );

    await runWithPendingInstalledMods(
      uniqueEntries.map((entry) => entry.modName),
      async () => {
        const queuedModNames: string[] = [];
        const failedModNames: string[] = [];

        for (const entry of uniqueEntries) {
          const result = await modsService.queueUpdateInstalled(
            entry.modName,
            entry.fileName,
          );

          if (result.ok) {
            queuedModNames.push(entry.modName);
          } else {
            failedModNames.push(entry.modName);
          }
        }

        await refreshInstalled();

        if (queuedModNames.length > 0) {
          options.onSuccess?.(
            `Queued updates for ${queuedModNames.length} mod${queuedModNames.length === 1 ? "" : "s"}.`,
          );
        }

        if (failedModNames.length > 0) {
          reportError(
            `Failed to queue updates for ${formatModNameList(failedModNames)}.`,
          );
        }
      },
    );
  }

  async function retryAllFailed(downloads: DownloadProgress[]): Promise<void> {
    const failedDownloads = downloads.filter(
      (download) => download.state === "failed",
    );
    await Promise.all(
      failedDownloads.map((download) => retryDownload(download)),
    );
  }

  async function fetchLatestVersions(): Promise<number> {
    return runWithInstalledBusy(async () => {
      const result = await modsService.getLatestVersions();
      let updateCount = 0;
      if (!result.ok) {
        reportError(result.error);
        return updateCount;
      }

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

      return updateCount;
    });
  }

  async function diffModListProfiles(
    leftProfileId: string,
    rightProfileId: string,
  ): Promise<ModListProfileComparison | null> {
    const result = await modsService.diffModListProfiles(
      leftProfileId,
      rightProfileId,
    );

    if (!result.ok) {
      reportError(result.error);
      return null;
    }

    return result.data;
  }

  return {
    applySettingsAndRefresh,
    bulkDeleteInstalled,
    bulkQueueUpdateInstalled,
    deleteInstalled,
    diffModListProfiles,
    fetchLatestVersions,
    getModToggleImpact,
    previewSyncFromModList,
    queueSelectedMod,
    queueUpdateAllInstalled,
    queueUpdateInstalled,
    refreshInstalled,
    refreshInstalledConflicts,
    retryAllFailed,
    retryDownload,
    setEnabled,
    syncFromModList,
  };
}
