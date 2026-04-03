import { ipcRenderer } from "electron";
import { ipcChannels } from "@shared/contracts/ipc-contracts";
import type { ElectronApi } from "../types/electron-api";

export const launchApi: ElectronApi["launch"] = {
  launchFactorio: (factorioPath: string) =>
    ipcRenderer.invoke(ipcChannels.launch.launchFactorio, factorioPath),
};
