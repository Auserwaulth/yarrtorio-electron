import { ipcRenderer } from "electron";
import { ipcChannels } from "@shared/contracts/ipc-contracts";
import type { ElectronApi } from "../types/electron-api";

/**
 * Renderer-safe wrapper around mod-related IPC calls.
 *
 * Each method mirrors a main-process handler and returns the serialized
 * `OperationResult` payload produced there.
 */
export const modsApi: ElectronApi["mods"] = {
  browse: (filters) => ipcRenderer.invoke(ipcChannels.mods.browse, filters),
  details: (modName) => ipcRenderer.invoke(ipcChannels.mods.details, modName),
  installed: () => ipcRenderer.invoke(ipcChannels.mods.installed),
  previewSyncFromModList: (input) =>
    ipcRenderer.invoke(ipcChannels.mods.previewSyncFromModList, input),
  syncFromModList: (input) =>
    ipcRenderer.invoke(ipcChannels.mods.syncFromModList, input),
  deleteInstalled: (input) =>
    ipcRenderer.invoke(ipcChannels.mods.deleteInstalled, input),
  queueUpdateInstalled: (input) =>
    ipcRenderer.invoke(ipcChannels.mods.queueUpdateInstalled, input),
  queueUpdateAllInstalled: () =>
    ipcRenderer.invoke(ipcChannels.mods.queueUpdateAllInstalled),
  setEnabled: (input) => ipcRenderer.invoke(ipcChannels.mods.setEnabled, input),
  getLibraryState: () => ipcRenderer.invoke(ipcChannels.mods.getLibraryState),
  getModToggleImpact: (input) =>
    ipcRenderer.invoke(ipcChannels.mods.getModToggleImpact, input),
  getLatestVersions: () =>
    ipcRenderer.invoke(ipcChannels.mods.getLatestVersions),
  getInstalledConflicts: () =>
    ipcRenderer.invoke(ipcChannels.mods.getInstalledConflicts),
  createModListProfile: (input) =>
    ipcRenderer.invoke(ipcChannels.mods.createModListProfile, input),
  renameModListProfile: (input) =>
    ipcRenderer.invoke(ipcChannels.mods.renameModListProfile, input),
  switchModListProfile: (input) =>
    ipcRenderer.invoke(ipcChannels.mods.switchModListProfile, input),
  removeModListProfile: (input) =>
    ipcRenderer.invoke(ipcChannels.mods.removeModListProfile, input),
  diffModListProfiles: (input) =>
    ipcRenderer.invoke(ipcChannels.mods.diffModListProfiles, input),
  exportModListProfile: (input) =>
    ipcRenderer.invoke(ipcChannels.mods.exportModListProfile, input),
  importModListProfile: () =>
    ipcRenderer.invoke(ipcChannels.mods.importModListProfile),
};
