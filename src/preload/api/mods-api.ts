import { ipcRenderer } from "electron";
import { ipcChannels } from "@shared/contracts/ipc-contracts";
import type { ElectronApi } from "../types/electron-api";

export const modsApi: ElectronApi["mods"] = {
  browse: (filters) => ipcRenderer.invoke(ipcChannels.mods.browse, filters),
  details: (modName) => ipcRenderer.invoke(ipcChannels.mods.details, modName),
  installed: () => ipcRenderer.invoke(ipcChannels.mods.installed),
  syncFromModList: (input) =>
    ipcRenderer.invoke(ipcChannels.mods.syncFromModList, input),
  deleteInstalled: (input) =>
    ipcRenderer.invoke(ipcChannels.mods.deleteInstalled, input),
  queueUpdateInstalled: (input) =>
    ipcRenderer.invoke(ipcChannels.mods.queueUpdateInstalled, input),
  setEnabled: (input) => ipcRenderer.invoke(ipcChannels.mods.setEnabled, input),
};
