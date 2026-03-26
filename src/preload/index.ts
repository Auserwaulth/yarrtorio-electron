import { contextBridge } from "electron";
import { modsApi } from "./api/mods-api";
import { downloadsApi } from "./api/downloads-api";
import { settingsApi } from "./api/settings-api";
import { appApi } from "./api/app-api";
import { externalApi } from "./api/external-api";
import type { ElectronApi } from "./types/electron-api";

/**
 * Narrow preload bridge exposed to the renderer.
 *
 * Only the curated API surface defined by `ElectronApi` is published so the
 * renderer can invoke main-process features without direct Node.js access.
 */
const api: ElectronApi = {
  mods: modsApi,
  downloads: downloadsApi,
  settings: settingsApi,
  app: appApi,
  external: externalApi,
};

/**
 * Publishes the preload bridge on `window.electronApi`.
 */
contextBridge.exposeInMainWorld("electronApi", api);
