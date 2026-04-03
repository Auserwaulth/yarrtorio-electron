import type {
  BrowseFilters,
  DownloadEnqueueInput,
  DownloadProgress,
} from "@shared/types/mod";

export const modsService = {
  browse: (filters: BrowseFilters) => window.electronApi.mods.browse(filters),
  details: (modName: string) => window.electronApi.mods.details(modName),
  installed: () => window.electronApi.mods.installed(),
  syncFromModList: (includeDisabled: boolean) =>
    window.electronApi.mods.syncFromModList({ includeDisabled }),
  deleteInstalled: (modName: string, fileName: string) =>
    window.electronApi.mods.deleteInstalled({ modName, fileName }),
  queueUpdateInstalled: (modName: string, fileName: string) =>
    window.electronApi.mods.queueUpdateInstalled({ modName, fileName }),
  setEnabled: (modName: string, enabled: boolean, relatedModNames?: string[]) =>
    window.electronApi.mods.setEnabled({
      modName,
      enabled,
      ...(relatedModNames !== undefined ? { relatedModNames } : {}),
    }),
  getLibraryState: () => window.electronApi.mods.getLibraryState(),
  getModToggleImpact: (modName: string, enabled: boolean) =>
    window.electronApi.mods.getModToggleImpact({ modName, enabled }),
  enqueueDownload: (request: DownloadEnqueueInput) =>
    window.electronApi.downloads.enqueue(request),
  retryDownload: (download: DownloadProgress) =>
    window.electronApi.downloads.retry(download),
  getLatestVersions: () => window.electronApi.mods.getLatestVersions(),
  getInstalledConflicts: () => window.electronApi.mods.getInstalledConflicts(),
  createModListProfile: (name: string) =>
    window.electronApi.mods.createModListProfile({ name }),
  renameModListProfile: (profileId: string, name: string) =>
    window.electronApi.mods.renameModListProfile({ profileId, name }),
  switchModListProfile: (profileId: string) =>
    window.electronApi.mods.switchModListProfile({ profileId }),
  removeModListProfile: (profileId: string) =>
    window.electronApi.mods.removeModListProfile({ profileId }),
};
