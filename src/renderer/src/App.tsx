// Welcome to my realm of spaghetti code!
// Have fun making sense of this mess. I sure don't.

import { useEffect, useMemo, useRef, useState } from "react";
import { AppContent } from "./app/app-content";
import { type PageKey } from "./app/app-routes";
import { AppHeader } from "./components/app-header";
import { BentoShell } from "./components/bento-shell";
import { ModDetailsModal } from "./components/mod-details-modal";
import { SidebarNav } from "./components/sidebar-nav";
import { useAppStore } from "./store/app-store";
import { useBootstrap } from "./hooks/use-bootstrap";
import { useModsActions } from "./features/mods/hooks/use-mods-actions";
import { useSettingsActions } from "./features/settings/hooks/use-settings-actions";
import { useToastCenter } from "./hooks/use-toast-center";
import { useDownloadToastListener } from "./hooks/use-download-toast-listener";
import { useBrowseController } from "./hooks/use-browse-controller";
import { defaultSettings } from "./app/app-default-settings";
import { AppLoadingScreen } from "./app/app-loading-screen";
import { AppToastRegion } from "./app/app-toast-region";

export function App() {
  const { store, setStore } = useAppStore();
  const {
    loading,
    progress,
    stage,
    error: bootstrapError,
  } = useBootstrap(setStore);
  const [page, setPage] = useState<PageKey>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const settings = store.settings ?? defaultSettings;

  const { toasts, pushToast, toastPositionClass } = useToastCenter(
    settings.snackbarPosition,
  );

  const browse = useBrowseController();
  const previousUpdateStatus = useRef(store.appUpdate?.status ?? null);

  const modsActions = useModsActions(setStore, settings.modsFolder, {
    onInfo: (message) => pushToast("info", message),
    onError: (message) => pushToast("error", message),
    onSuccess: (message) => pushToast("success", message),
  });

  const settingsActions = useSettingsActions(setStore, {
    onError: (message) => pushToast("error", message),
    onSuccess: (message) => pushToast("success", message),
  });

  const includeDisabled = useMemo(
    () => !settings.ignoreDisabledMods || settings.includeDisabledModsByDefault,
    [settings.ignoreDisabledMods, settings.includeDisabledModsByDefault],
  );

  useEffect(() => {
    if (bootstrapError) {
      pushToast("error", bootstrapError);
    }
  }, [bootstrapError, pushToast]);

  useEffect(() => {
    const nextStatus = store.appUpdate?.status ?? null;
    if (!nextStatus || nextStatus === previousUpdateStatus.current) {
      previousUpdateStatus.current = nextStatus;
      return;
    }

    if (nextStatus === "available" && store.appUpdate?.availableVersion) {
      pushToast(
        "info",
        `Version ${store.appUpdate.availableVersion} is available to download.`,
      );
    }

    if (nextStatus === "downloaded" && store.appUpdate?.downloadedVersion) {
      pushToast(
        "success",
        `Version ${store.appUpdate.downloadedVersion} is ready to install.`,
      );
    }

    if (nextStatus === "error" && store.appUpdate?.message) {
      pushToast("error", store.appUpdate.message);
    }

    previousUpdateStatus.current = nextStatus;
  }, [pushToast, store.appUpdate]);

  useDownloadToastListener({
    downloads: store.downloads,
    onToast: pushToast,
    onCompletedDownload: () => {
      void modsActions.refreshInstalled();
    },
  });

  useEffect(() => {
    if (page !== "browse") return;
    void modsActions.browse(browse.filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    if (page !== "browse" || !store.settings) return;
    void modsActions.browse(browse.filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, store.settings?.activeModListProfileId]);

  useEffect(() => {
    if (page !== "installed") return;
    void modsActions.refreshInstalled(true);
    if (!settings.modsFolder.trim()) {
      setStore((current) => ({ ...current, latestVersions: {} }));
      return;
    }
    void modsActions.fetchLatestVersions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, settings.activeModListProfileId, settings.modsFolder]);

  if (loading) {
    return <AppLoadingScreen progress={progress} stage={stage} />;
  }

  async function saveSettings(next = settings): Promise<void> {
    await settingsActions.save(next);
  }

  async function applyBrowse(nextPage?: number): Promise<void> {
    const nextFilters = browse.buildFilters(nextPage);

    if ((nextPage ?? browse.filters.page) !== browse.filters.page) {
      browse.actions.setPage(nextFilters.page);
    }

    await modsActions.browse(nextFilters);
  }

  return (
    <>
      <BentoShell
        header={
          <AppHeader
            collapsed={sidebarCollapsed}
            onToggleSidebar={() => setSidebarCollapsed((current) => !current)}
          />
        }
        sidebar={
          <SidebarNav
            active={page}
            collapsed={sidebarCollapsed}
            onSelect={setPage}
          />
        }
      >
        <AppContent
          page={page}
          dashboard={{
            installed: store.installed,
            downloads: store.downloads,
            onOpenBrowse: () => setPage("browse"),
            openInstalled: () => setPage("installed"),
            onSyncFromModList: () =>
              void modsActions.syncFromModList(includeDisabled),
            onRetryDownload: (download) =>
              void modsActions.retryDownload(download),
            onRetryAllFailed: (downloads) =>
              void modsActions.retryAllFailed(downloads),
            onLaunchFactorio: () => {
              if (!settings.factorioPath) {
                pushToast(
                  "error",
                  "Set Factorio executable path in Settings first",
                );
                return;
              }
              void window.electronApi.launch.launchFactorio().then((result) => {
                if (!result.ok) {
                  pushToast("error", result.error);
                }
              });
            },
            factorioPath: settings.factorioPath,
            appMeta: store.appMeta,
          }}
          browse={{
            mods: store.mods,
            filters: browse.filters,
            pagination: store.modsPagination,
            busy: modsActions.browseBusy,
            onQueryChange: browse.actions.setQuery,
            onVersionChange: browse.actions.setVersion,
            onToggleCategory: browse.actions.toggleCategory,
            onToggleTag: browse.actions.toggleTag,
            onIncludeCategoriesChange: browse.actions.setIncludeCategories,
            onIncludeTagsChange: browse.actions.setIncludeTags,
            onIncludeDeprecatedChange: browse.actions.setIncludeDeprecated,
            onTabChange: browse.actions.setTab,
            onApply: (nextPage) => void applyBrowse(nextPage),
            onReset: () => {
              browse.actions.reset();
              void modsActions.browse(browse.defaultFilters);
            },
            onOpen: (modName) => void modsActions.selectMod(modName),
            onDownload: (modName, version) =>
              version
                ? void modsActions.queueSelectedMod(modName, version)
                : undefined,
            onSyncFromModList: () =>
              void modsActions.syncFromModList(includeDisabled),
          }}
          installed={{
            settings,
            items: store.installed,
            busy: modsActions.installedBusy,
            pendingModNames: modsActions.pendingInstalledModNames,
            latestVersions: store.latestVersions,
            installedConflicts: store.installedConflicts,
            onDelete: (modName, fileName) =>
              void modsActions.deleteInstalled(modName, fileName),
            onUpdate: (modName, fileName) =>
              void modsActions.queueUpdateInstalled(modName, fileName),
            onUpdateAllOutdated: () =>
              void modsActions.queueUpdateAllInstalled(),
            onToggleEnabled: (modName, enabled, relatedModNames) =>
              void modsActions.setEnabled(modName, enabled, relatedModNames),
            onGetModToggleImpact: (modName, enabled) =>
              modsActions.getModToggleImpact(modName, enabled),
            onOpen: (modName) => void modsActions.selectMod(modName),
            onCheckUpdates: async () => {
              const updateCount = await modsActions.fetchLatestVersions();
              if (updateCount > 0) {
                pushToast(
                  "info",
                  `${updateCount} mod${updateCount === 1 ? "" : "s"} ${updateCount === 1 ? "has" : "have"} updates available`,
                );
              } else {
                pushToast("info", "All mods are up to date");
              }
            },
            onCreateModListProfile: (name) =>
              void modsActions.createModListProfile(name),
            onRenameModListProfile: (profileId, name) =>
              void modsActions.renameModListProfile(profileId, name),
            onSwitchModListProfile: (profileId) =>
              void modsActions.switchModListProfile(profileId),
            onRemoveModListProfile: (profileId) =>
              void modsActions.removeModListProfile(profileId),
          }}
          settings={{
            settings,
            saving: settingsActions.saving,
            appMeta: store.appMeta,
            appUpdate: store.appUpdate,
            onChange: (next) => void saveSettings(next),
            onPickFolder: () =>
              void settingsActions.chooseFolder().then((folder) => {
                if (folder)
                  return saveSettings({ ...settings, modsFolder: folder });
              }),
            onPickFactorio: () =>
              void settingsActions.chooseFactorioExecutable().then((path) => {
                if (path)
                  return saveSettings({ ...settings, factorioPath: path });
              }),
            onOpenLogFolder: () => {
              if (!store.appMeta?.logPath) return;
              void window.electronApi.external.openPath(store.appMeta.logPath);
            },
            onCheckForUpdates: () => {
              void window.electronApi.app.checkForUpdates().then((result) => {
                if (!result.ok) {
                  pushToast("error", result.error);
                  return;
                }

                if (
                  ["unavailable", "unsupported"].includes(result.data.status) &&
                  result.data.message
                ) {
                  pushToast("info", result.data.message);
                }
              });
            },
            onDownloadUpdate: () => {
              void window.electronApi.app.downloadUpdate().then((result) => {
                if (!result.ok) {
                  pushToast("error", result.error);
                }
              });
            },
            onInstallUpdate: () => {
              void window.electronApi.app
                .quitAndInstallUpdate()
                .then((result) => {
                  if (!result.ok) {
                    pushToast("error", result.error);
                    return;
                  }

                  if (!result.data) {
                    pushToast("info", "No downloaded update is ready yet.");
                  }
                });
            },
          }}
        />
      </BentoShell>

      <AppToastRegion toasts={toasts} positionClass={toastPositionClass} />

      <ModDetailsModal
        mod={store.selectedMod}
        loading={store.selectedModLoading}
        pendingName={store.selectedModPendingName}
        onClose={() => modsActions.closeSelectedMod()}
        onDownload={(selection) =>
          store.selectedMod
            ? void modsActions.queueSelectedMod(
                store.selectedMod.name,
                selection.version,
                selection.includeDependencies,
              )
            : undefined
        }
      />
    </>
  );
}
