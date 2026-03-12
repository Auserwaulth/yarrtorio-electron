import { ipcRenderer } from "electron";
import { ipcChannels } from "@shared/contracts/ipc-contracts";
import type { ElectronApi } from "../types/electron-api";

export const downloadsApi: ElectronApi["downloads"] = {
  enqueue: (request) =>
    ipcRenderer.invoke(ipcChannels.downloads.enqueue, request),
  list: () => ipcRenderer.invoke(ipcChannels.downloads.list),
  onProgress: (listener) => {
    const wrapped = (
      _event: unknown,
      payload: Parameters<typeof listener>[0],
    ) => listener(payload);
    ipcRenderer.on(ipcChannels.downloads.subscribe, wrapped);
    return () =>
      ipcRenderer.removeListener(ipcChannels.downloads.subscribe, wrapped);
  },
};
