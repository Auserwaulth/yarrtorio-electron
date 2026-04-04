import type {
  AppSettings,
  BulkUpdateInstalledResult,
  BrowseFilters,
  DownloadEnqueueInput,
  BrowseResult,
  DownloadProgress,
  InstalledConflict,
  InstalledMod,
  ModLibraryState,
  ModToggleImpact,
  ModDetails,
  ModListProfileComparison,
  ExportModListProfileResult,
  ImportModListProfileResult,
  ModSummary,
  OperationResult,
} from "@shared/types/mod";

import type { AppMeta } from "@shared/types/app-meta";
import type { AppUpdateState } from "@shared/types/app-update";

export interface ElectronApi {
  mods: {
    browse(filters: BrowseFilters): Promise<OperationResult<BrowseResult>>;
    details(modName: string): Promise<OperationResult<ModDetails>>;
    installed(): Promise<OperationResult<InstalledMod[]>>;
    syncFromModList(input: {
      includeDisabled: boolean;
    }): Promise<OperationResult<ModSummary[]>>;
    deleteInstalled(input: {
      modName: string;
      fileName: string;
    }): Promise<OperationResult<boolean>>;
    queueUpdateInstalled(input: {
      modName: string;
      fileName: string;
    }): Promise<OperationResult<string>>;
    queueUpdateAllInstalled(): Promise<
      OperationResult<BulkUpdateInstalledResult>
    >;
    setEnabled(input: {
      modName: string;
      enabled: boolean;
      relatedModNames?: string[];
    }): Promise<OperationResult<boolean>>;
    getLibraryState(): Promise<
      OperationResult<Record<string, ModLibraryState>>
    >;
    getModToggleImpact(input: {
      modName: string;
      enabled: boolean;
    }): Promise<OperationResult<ModToggleImpact>>;
    getLatestVersions(): Promise<OperationResult<Record<string, string>>>;
    getInstalledConflicts(): Promise<
      OperationResult<Record<string, InstalledConflict[]>>
    >;
    createModListProfile(input: {
      name: string;
    }): Promise<OperationResult<AppSettings>>;
    renameModListProfile(input: {
      profileId: string;
      name: string;
    }): Promise<OperationResult<AppSettings>>;
    switchModListProfile(input: {
      profileId: string;
    }): Promise<OperationResult<AppSettings>>;
    removeModListProfile(input: {
      profileId: string;
    }): Promise<OperationResult<AppSettings>>;
    diffModListProfiles(input: {
      leftProfileId: string;
      rightProfileId: string;
    }): Promise<OperationResult<ModListProfileComparison>>;
    exportModListProfile(input: {
      profileId: string;
    }): Promise<OperationResult<ExportModListProfileResult>>;
    importModListProfile(): Promise<
      OperationResult<ImportModListProfileResult>
    >;
  };
  downloads: {
    enqueue(request: DownloadEnqueueInput): Promise<OperationResult<string>>;
    list(): Promise<OperationResult<DownloadProgress[]>>;
    retry(download: DownloadProgress): Promise<OperationResult<string>>;
    onProgress(listener: (progress: DownloadProgress) => void): () => void;
  };
  settings: {
    get(): Promise<OperationResult<AppSettings>>;
    update(settings: AppSettings): Promise<OperationResult<AppSettings>>;
    chooseFolder(): Promise<OperationResult<string>>;
    chooseModListFile(): Promise<OperationResult<string>>;
    chooseFactorioExecutable(): Promise<OperationResult<string>>;
  };
  app: {
    meta(): Promise<OperationResult<AppMeta>>;
    getUpdateState(): Promise<OperationResult<AppUpdateState>>;
    checkForUpdates(): Promise<OperationResult<AppUpdateState>>;
    downloadUpdate(): Promise<OperationResult<AppUpdateState>>;
    quitAndInstallUpdate(): Promise<OperationResult<boolean>>;
    onUpdateState(listener: (state: AppUpdateState) => void): () => void;
  };
  external: {
    openUrl(url: string): Promise<void>;
    openPath(path: string): Promise<string>;
  };
  launch: {
    launchFactorio(): Promise<OperationResult<boolean>>;
  };
}
