import { ipcRenderer } from "electron";
import { ipcChannels } from "@shared/contracts/ipc-contracts";
import type { ElectronApi } from "../types/electron-api";

export const appApi: ElectronApi["app"] = {
  meta: () => ipcRenderer.invoke(ipcChannels.app.meta),
};
