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
  selectedModLoading: boolean;
  selectedModPendingName: string | null;
  installed: InstalledMod[];
  downloads: DownloadProgress[];
}

const initialStore: AppStore = {
  settings: null,
  appMeta: null,
  mods: [],
  modsPagination: null,
  selectedMod: null,
  selectedModLoading: false,
  selectedModPendingName: null,
  installed: [],
  downloads: [],
};

function upsertRecentDownload(
  downloads: DownloadProgress[],
  progress: DownloadProgress,
): DownloadProgress[] {
  // When a new download starts (queued/running), remove any failed entries for the same mod
  if (progress.state === "queued" || progress.state === "running") {
    const filtered = downloads.filter(
      (item) =>
        !(
          item.modName === progress.modName &&
          item.version === progress.version &&
          item.state === "failed"
        ),
    );
    // Also remove the existing entry if it has the same key
    const existingIndex = filtered.findIndex(
      (item) => item.key === progress.key,
    );
    if (existingIndex === -1) {
      return [progress, ...filtered].slice(0, MAX_DOWNLOAD_HISTORY);
    }
    const next = [...filtered];
    next[existingIndex] = progress;
    return next;
  }

  const existingIndex = downloads.findIndex(
    (item) => item.key === progress.key,
  );

  if (existingIndex === -1) {
    return [progress, ...downloads].slice(0, MAX_DOWNLOAD_HISTORY);
  }

  const next = [...downloads];
  next[existingIndex] = progress;

  return next;
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
