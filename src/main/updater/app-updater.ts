import { app, BrowserWindow } from "electron";
import { ipcChannels } from "@shared/contracts/ipc-contracts";
import type { AppUpdateState } from "@shared/types/app-update";
import { logError, logInfo, logWarn } from "../logging/logger";
import electronUpdater from "electron-updater";

const { autoUpdater } = electronUpdater;

const STARTUP_CHECK_DELAY_MS = 12_000;

const initialState: AppUpdateState = {
  status: "idle",
  currentVersion: app.getVersion(),
  availableVersion: null,
  downloadedVersion: null,
  progressPercent: null,
  transferredBytes: null,
  totalBytes: null,
  message: null,
  checkedAt: null,
};

function broadcast(state: AppUpdateState): void {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(ipcChannels.app.subscribeToUpdates, state);
  }
}

function canUseAutoUpdates(): boolean {
  if (!app.isPackaged) {
    return false;
  }

  if (process.platform === "win32") {
    return !process.env.PORTABLE_EXECUTABLE_FILE;
  }

  if (process.platform === "linux") {
    return Boolean(process.env.APPIMAGE);
  }

  return false;
}

function getUnsupportedMessage(): string {
  if (!app.isPackaged) {
    return "Updater works in packaged releases only.";
  }

  if (process.platform === "win32" && process.env.PORTABLE_EXECUTABLE_FILE) {
    return "Updater is available for installed Windows builds only.";
  }

  if (process.platform === "linux" && !process.env.APPIMAGE) {
    return "Updater is available for AppImage releases only.";
  }

  return "Automatic updates are not supported on this platform.";
}

export interface AppUpdater {
  init(): void;
  getState(): AppUpdateState;
  checkForUpdates(): Promise<AppUpdateState>;
  downloadUpdate(): Promise<AppUpdateState>;
  quitAndInstall(): Promise<boolean>;
}

export function createAppUpdater(): AppUpdater {
  let initialized = false;
  let state: AppUpdateState = { ...initialState };

  function setState(next: Partial<AppUpdateState>): AppUpdateState {
    state = {
      ...state,
      ...next,
      currentVersion: app.getVersion(),
    };
    broadcast(state);
    return state;
  }

  function setUnsupportedState(): AppUpdateState {
    return setState({
      status: "unsupported",
      checkedAt: new Date().toISOString(),
      message: getUnsupportedMessage(),
    });
  }

  function wireUpdaterEvents(): void {
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.allowPrerelease = false;

    autoUpdater.on("checking-for-update", () => {
      void logInfo("updater", "Checking for updates");
      setState({
        status: "checking",
        progressPercent: null,
        transferredBytes: null,
        totalBytes: null,
        message: "Checking for updates...",
      });
    });

    autoUpdater.on("update-available", (info) => {
      void logInfo("updater", "Update available", { version: info.version });
      setState({
        status: "available",
        availableVersion: info.version,
        downloadedVersion: null,
        progressPercent: null,
        transferredBytes: null,
        totalBytes: null,
        checkedAt: new Date().toISOString(),
        message: `Version ${info.version} is ready to download.`,
      });
    });

    autoUpdater.on("update-not-available", () => {
      void logInfo("updater", "No update available");
      setState({
        status: "unavailable",
        availableVersion: null,
        downloadedVersion: null,
        progressPercent: null,
        transferredBytes: null,
        totalBytes: null,
        checkedAt: new Date().toISOString(),
        message: "You already have the latest version.",
      });
    });

    autoUpdater.on("download-progress", (progress) => {
      setState({
        status: "downloading",
        progressPercent: progress.percent,
        transferredBytes: progress.transferred,
        totalBytes: progress.total,
        message: `Downloading version ${state.availableVersion ?? "update"}...`,
      });
    });

    autoUpdater.on("update-downloaded", (info) => {
      void logInfo("updater", "Update downloaded", { version: info.version });
      setState({
        status: "downloaded",
        downloadedVersion: info.version,
        progressPercent: 100,
        transferredBytes: null,
        totalBytes: null,
        checkedAt: new Date().toISOString(),
        message: `Version ${info.version} is ready to install.`,
      });
    });

    autoUpdater.on("error", (error) => {
      void logError("updater", "Updater error", error);
      setState({
        status: "error",
        checkedAt: new Date().toISOString(),
        message:
          error instanceof Error
            ? error.message
            : "Failed to complete the update flow.",
      });
    });
  }

  async function checkForUpdates(): Promise<AppUpdateState> {
    if (!canUseAutoUpdates()) {
      return setUnsupportedState();
    }

    try {
      await autoUpdater.checkForUpdates();
    } catch (error) {
      await logError("updater", "checkForUpdates failed", error);
      return setState({
        status: "error",
        checkedAt: new Date().toISOString(),
        message:
          error instanceof Error
            ? error.message
            : "Failed to check for updates.",
      });
    }

    return state;
  }

  async function downloadUpdate(): Promise<AppUpdateState> {
    if (!canUseAutoUpdates()) {
      return setUnsupportedState();
    }

    if (state.status === "downloading") {
      return state;
    }

    if (state.status !== "available") {
      await logWarn("updater", "Download requested without available update", {
        status: state.status,
      });
      return setState({
        message:
          state.status === "downloaded"
            ? "Update already downloaded."
            : "No update is ready to download.",
      });
    }

    try {
      await autoUpdater.downloadUpdate();
    } catch (error) {
      await logError("updater", "downloadUpdate failed", error);
      return setState({
        status: "error",
        checkedAt: new Date().toISOString(),
        message:
          error instanceof Error
            ? error.message
            : "Failed to download the update.",
      });
    }

    return state;
  }

  async function quitAndInstall(): Promise<boolean> {
    if (state.status !== "downloaded") {
      await logWarn("updater", "quitAndInstall requested without update", {
        status: state.status,
      });
      return false;
    }

    await logInfo("updater", "Installing downloaded update", {
      version: state.downloadedVersion,
    });
    autoUpdater.quitAndInstall();
    return true;
  }

  function init(): void {
    if (initialized) {
      return;
    }

    initialized = true;

    if (!canUseAutoUpdates()) {
      setUnsupportedState();
      return;
    }

    wireUpdaterEvents();

    setTimeout(() => {
      void checkForUpdates();
    }, STARTUP_CHECK_DELAY_MS);
  }

  return {
    init,
    getState: () => state,
    checkForUpdates,
    downloadUpdate,
    quitAndInstall,
  };
}
