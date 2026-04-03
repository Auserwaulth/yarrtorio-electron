import { ipcRenderer } from "electron";
import { ipcChannels } from "@shared/contracts/ipc-contracts";
import type { ElectronApi } from "../types/electron-api";

export const settingsApi: ElectronApi["settings"] = {
  get: () => ipcRenderer.invoke(ipcChannels.settings.get),
  update: (settings) =>
    ipcRenderer.invoke(ipcChannels.settings.update, settings),
  chooseFolder: () => ipcRenderer.invoke(ipcChannels.settings.chooseFolder),
  chooseModListFile: () =>
    ipcRenderer.invoke(ipcChannels.settings.chooseModListFile),
  chooseFactorioExecutable: () =>
    ipcRenderer.invoke(ipcChannels.settings.chooseFactorioExecutable),
};
