import { contextBridge } from "electron";
import { modsApi } from "./api/mods-api";
import { downloadsApi } from "./api/downloads-api";
import { settingsApi } from "./api/settings-api";
import { appApi } from "./api/app-api";
import { externalApi } from "./api/external-api";
import type { ElectronApi } from "./types/electron-api";

const api: ElectronApi = {
  mods: modsApi,
  downloads: downloadsApi,
  settings: settingsApi,
  app: appApi,
  external: externalApi,
};

contextBridge.exposeInMainWorld("electronApi", api);
