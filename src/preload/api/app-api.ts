import { ipcRenderer } from "electron";
import { ipcChannels } from "@shared/contracts/ipc-contracts";
import type { ElectronApi } from "../types/electron-api";

export const appApi: ElectronApi["app"] = {
  meta: () => ipcRenderer.invoke(ipcChannels.app.meta),
  getUpdateState: () => ipcRenderer.invoke(ipcChannels.app.updateState),
  checkForUpdates: () => ipcRenderer.invoke(ipcChannels.app.checkForUpdates),
  downloadUpdate: () => ipcRenderer.invoke(ipcChannels.app.downloadUpdate),
  quitAndInstallUpdate: () =>
    ipcRenderer.invoke(ipcChannels.app.quitAndInstallUpdate),
  onUpdateState: (listener) => {
    const wrapped = (
      _event: unknown,
      payload: Parameters<typeof listener>[0],
    ) => listener(payload);
    ipcRenderer.on(ipcChannels.app.subscribeToUpdates, wrapped);
    return () =>
      ipcRenderer.removeListener(ipcChannels.app.subscribeToUpdates, wrapped);
  },
};
