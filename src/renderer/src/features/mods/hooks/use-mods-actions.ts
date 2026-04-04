import type { AppStore } from "../../../store/app-store";
import { useModsActionRuntime } from "./use-mods-action-runtime";
import type {
  ModsActionOptions,
  SettingsResult,
} from "./use-mods-action-types";
import { useModsBrowseActions } from "./use-mods-browse-actions";
import { useModsInstalledActions } from "./use-mods-installed-actions";
import { useModsProfileActions } from "./use-mods-profile-actions";

export function useModsActions(
  setStore: React.Dispatch<React.SetStateAction<AppStore>>,
  modsFolder: string,
  options: ModsActionOptions = {},
) {
  const runtime = useModsActionRuntime(setStore, modsFolder, options);

  const installedActions = useModsInstalledActions({
    runtime,
    async applySettingsAndRefresh(
      result: SettingsResult,
      successMessage: string,
    ): Promise<void> {
      if (!result.ok) {
        runtime.reportError(result.error);
        return;
      }

      runtime.setStore((current) => ({ ...current, settings: result.data }));
      runtime.options.onSuccess?.(successMessage);
      await installedActions.refreshInstalled();
    },
  });

  const browseActions = useModsBrowseActions(runtime);
  const profileActions = useModsProfileActions({
    runtime,
    applySettingsAndRefresh: installedActions.applySettingsAndRefresh,
    refreshInstalled: installedActions.refreshInstalled,
  });

  return {
    ...browseActions,
    ...installedActions,
    ...profileActions,
    browseBusy: runtime.browseBusy,
    installedBusy: runtime.installedBusy,
    pendingInstalledModNames: runtime.pendingInstalledModNames,
  };
}
