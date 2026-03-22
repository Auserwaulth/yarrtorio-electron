import type {
  AppSettings,
  BrowseFilters,
  BrowseResult,
  DownloadProgress,
  DownloadRequest,
  InstalledMod,
  ModDetails,
  ModSummary,
  OperationResult,
} from "@shared/types/mod";

import type { AppMeta } from "@shared/types/app-meta";

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
      filePath: string;
    }): Promise<OperationResult<boolean>>;
    queueUpdateInstalled(input: {
      modName: string;
      filePath: string;
    }): Promise<OperationResult<string>>;
    setEnabled(input: {
      modName: string;
      enabled: boolean;
    }): Promise<OperationResult<boolean>>;
  };
  downloads: {
    enqueue(request: DownloadRequest): Promise<OperationResult<string>>;
    list(): Promise<OperationResult<DownloadProgress[]>>;
    retry(download: DownloadProgress): Promise<OperationResult<string>>;
    onProgress(listener: (progress: DownloadProgress) => void): () => void;
  };
  settings: {
    get(): Promise<OperationResult<AppSettings>>;
    update(settings: AppSettings): Promise<OperationResult<AppSettings>>;
    chooseFolder(): Promise<OperationResult<string>>;
    chooseModListFile(): Promise<OperationResult<string>>;
  };
  app: {
    meta(): Promise<OperationResult<AppMeta>>;
  };
  external: {
    openUrl(url: string): Promise<void>;
    openPath(path: string): Promise<string>;
  };
}
