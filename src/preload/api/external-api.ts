import { ipcRenderer } from "electron";
import { ipcChannels } from "@shared/contracts/ipc-contracts";

export const externalApi = {
  openUrl(url: string): Promise<void> {
    return ipcRenderer.invoke(ipcChannels.external.openUrl, url);
  },
  openPath(path: string): Promise<string> {
    return ipcRenderer.invoke(ipcChannels.external.openPath, path);
  },
};
