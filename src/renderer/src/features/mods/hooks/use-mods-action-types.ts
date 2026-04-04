import type {
  AppSettings,
  ModLibraryState,
  OperationResult,
} from "@shared/types/mod";
import type { AppStore } from "../../../store/app-store";

export interface ModsActionOptions {
  onInfo?(message: string): void;
  onError?(message: string): void;
  onSuccess?(message: string): void;
}

export interface ModsActionRuntime {
  setStore: React.Dispatch<React.SetStateAction<AppStore>>;
  modsFolder: string;
  options: ModsActionOptions;
  browseBusy: boolean;
  installedBusy: boolean;
  pendingInstalledModNames: string[];
  latestBrowseRequestId: React.MutableRefObject<number>;
  latestSelectedModRequestId: React.MutableRefObject<number>;
  reportError(message: string): void;
  formatModNameList(modNames: string[]): string;
  runWithBrowseBusy<T>(task: () => Promise<T>): Promise<T>;
  runWithInstalledBusy<T>(task: () => Promise<T>): Promise<T>;
  runWithPendingInstalledMods<T>(
    modNames: string[],
    task: () => Promise<T>,
  ): Promise<T>;
}

export type SettingsResult = OperationResult<AppSettings>;

export function getNextLibraryState(
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
