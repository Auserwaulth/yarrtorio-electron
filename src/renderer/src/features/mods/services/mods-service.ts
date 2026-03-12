import type { BrowseFilters, DownloadRequest } from "@shared/types/mod";

export const modsService = {
  browse: (filters: BrowseFilters) => window.electronApi.mods.browse(filters),
  details: (modName: string) => window.electronApi.mods.details(modName),
  installed: () => window.electronApi.mods.installed(),
  syncFromModList: (includeDisabled: boolean) =>
    window.electronApi.mods.syncFromModList({ includeDisabled }),
  deleteInstalled: (modName: string, filePath: string) =>
    window.electronApi.mods.deleteInstalled({ modName, filePath }),
  queueUpdateInstalled: (modName: string, filePath: string) =>
    window.electronApi.mods.queueUpdateInstalled({ modName, filePath }),
  setEnabled: (modName: string, enabled: boolean) =>
    window.electronApi.mods.setEnabled({ modName, enabled }),
  enqueueDownload: (request: DownloadRequest) =>
    window.electronApi.downloads.enqueue(request),
};
