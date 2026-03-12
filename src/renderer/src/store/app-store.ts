import { useEffect, useMemo, useState } from "react";
import type {
  AppSettings,
  BrowsePagination,
  DownloadProgress,
  InstalledMod,
  ModDetails,
  ModSummary,
} from "@shared/types/mod";
import type { AppMeta } from "@shared/types/app-meta";

import { MAX_DOWNLOAD_HISTORY } from "@shared/constants";

export interface AppStore {
  settings: AppSettings | null;
  appMeta: AppMeta | null;
  mods: ModSummary[];
  modsPagination: BrowsePagination | null;
  selectedMod: ModDetails | null;
  installed: InstalledMod[];
  downloads: DownloadProgress[];
}

const initialStore: AppStore = {
  settings: null,
  appMeta: null,
  mods: [],
  modsPagination: null,
  selectedMod: null,
  installed: [],
  downloads: [],
};

function upsertRecentDownload(
  downloads: DownloadProgress[],
  progress: DownloadProgress,
): DownloadProgress[] {
  const existingIndex = downloads.findIndex(
    (item) => item.key === progress.key,
  );

  if (existingIndex === -1) {
    return [progress, ...downloads].slice(0, MAX_DOWNLOAD_HISTORY);
  }

  const next = [...downloads];
  next[existingIndex] = progress;

  return next
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_DOWNLOAD_HISTORY);
}

export function useAppStore() {
  const [store, setStore] = useState<AppStore>(initialStore);

  useEffect(() => {
    return window.electronApi.downloads.onProgress((progress) => {
      setStore((current) => ({
        ...current,
        downloads: upsertRecentDownload(current.downloads, progress),
      }));
    });
  }, []);

  return useMemo(() => ({ store, setStore }), [store]);
}
