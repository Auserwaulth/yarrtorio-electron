// Welcome to my realm of spaghetti code!
// Have fun making sense of this mess. I sure don't.

import { useEffect, useMemo, useState } from "react";
import { BentoShell } from "./components/bento-shell";
import { ModDetailsModal } from "./components/mod-details-modal";
import { SidebarNav, type PageKey } from "./components/sidebar-nav";
import { DashboardPage } from "./pages/dashboard/dashboard-page";
import { BrowsePage } from "./pages/browse/browse-page";
import { InstalledPage } from "./pages/installed/installed-page";
import { SettingsPage } from "./pages/settings/settings-page";
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

  const settings = store.settings ?? defaultSettings;

  const { toasts, pushToast, toastPositionClass } = useToastCenter(
    settings.snackbarPosition,
  );

  const browse = useBrowseController();

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
    if (page !== "installed") return;
    void modsActions.fetchLatestVersions();
  }, [page, modsActions]);

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
      <BentoShell sidebar={<SidebarNav active={page} onSelect={setPage} />}>
        {page === "dashboard" && (
          <DashboardPage
            installed={store.installed}
            downloads={store.downloads}
            onOpenBrowse={() => setPage("browse")}
            openInstalled={() => setPage("installed")}
            onSyncFromModList={() =>
              void modsActions.syncFromModList(includeDisabled)
            }
            onRetryDownload={(download) =>
              void modsActions.retryDownload(download)
            }
            onRetryAllFailed={(downloads) =>
              void modsActions.retryAllFailed(downloads)
            }
            appMeta={store.appMeta}
          />
        )}

        {page === "browse" && (
          <BrowsePage
            mods={store.mods}
            filters={browse.filters}
            pagination={store.modsPagination}
            busy={modsActions.busy}
            onQueryChange={browse.actions.setQuery}
            onVersionChange={browse.actions.setVersion}
            onToggleCategory={browse.actions.toggleCategory}
            onToggleTag={browse.actions.toggleTag}
            onIncludeCategoriesChange={browse.actions.setIncludeCategories}
            onIncludeTagsChange={browse.actions.setIncludeTags}
            onIncludeDeprecatedChange={browse.actions.setIncludeDeprecated}
            onTabChange={browse.actions.setTab}
            onApply={(nextPage) => void applyBrowse(nextPage)}
            onReset={() => {
              browse.actions.reset();
              void modsActions.browse(browse.defaultFilters);
            }}
            onOpen={(modName) => void modsActions.selectMod(modName)}
            onDownload={(modName, version) =>
              version
                ? void modsActions.queueSelectedMod(modName, version)
                : undefined
            }
            onSyncFromModList={() =>
              void modsActions.syncFromModList(includeDisabled)
            }
          />
        )}

        {page === "installed" && (
          <InstalledPage
            items={store.installed}
            busy={modsActions.busy}
            latestVersions={store.latestVersions}
            onDelete={(modName, filePath) =>
              void modsActions.deleteInstalled(modName, filePath)
            }
            onUpdate={(modName, filePath) =>
              void modsActions.queueUpdateInstalled(modName, filePath)
            }
            onToggleEnabled={(modName, enabled) =>
              void modsActions.setEnabled(modName, enabled)
            }
            onOpen={(modName) => void modsActions.selectMod(modName)}
            onCheckUpdates={async () => {
              const updateCount = await modsActions.fetchLatestVersions();
              if (updateCount > 0) {
                pushToast(
                  "info",
                  `${updateCount} mod${updateCount === 1 ? "" : "s"} ${updateCount === 1 ? "has" : "have"} updates available`,
                );
              } else {
                pushToast("info", "All mods are up to date");
              }
            }}
          />
        )}

        {page === "settings" && (
          <SettingsPage
            settings={settings}
            saving={settingsActions.saving}
            appMeta={store.appMeta}
            onChange={(next) => void saveSettings(next)}
            onPickFolder={() =>
              void settingsActions.chooseFolder().then((folder) => {
                if (folder)
                  return saveSettings({ ...settings, modsFolder: folder });
              })
            }
            onPickModListFile={() =>
              void settingsActions.chooseModListFile().then((filePath) => {
                if (filePath)
                  return saveSettings({ ...settings, modListPath: filePath });
              })
            }
            onOpenLogFolder={() => {
              if (!store.appMeta?.logPath) return;
              void window.electronApi.external.openPath(store.appMeta.logPath);
            }}
          />
        )}
      </BentoShell>

      <AppToastRegion toasts={toasts} positionClass={toastPositionClass} />

      <ModDetailsModal
        mod={store.selectedMod}
        loading={store.selectedModLoading}
        pendingName={store.selectedModPendingName}
        onClose={() =>
          setStore((current) => ({
            ...current,
            selectedMod: null,
            selectedModLoading: false,
            selectedModPendingName: null,
          }))
        }
        onDownload={(selection) =>
          store.selectedMod
            ? void modsActions.queueSelectedMod(
                store.selectedMod.name,
                selection.version,
                undefined,
                selection.includeDependencies,
              )
            : undefined
        }
      />
    </>
  );
}
