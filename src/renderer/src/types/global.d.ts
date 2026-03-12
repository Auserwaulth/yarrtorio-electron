import type { ElectronApi } from "../../../preload/types/electron-api";

declare global {
  interface Window {
    electronApi: ElectronApi;
  }
}

export {};
