import { app } from "electron";
import { createMainWindow } from "./windows/main-window";
import { registerIpc } from "./ipc/register-ipc";
import { createSettingsService } from "./services/settings-service";
import { APP_USER_MODEL_ID } from "@shared/constants";
import { initLogger, logInfo } from "./logging/logger";

export async function createApp(): Promise<void> {
  if (process.platform === "win32") {
    app.setAppUserModelId(APP_USER_MODEL_ID);
  }

  await app.whenReady();

  // Initialize logger and log startup
  await initLogger();
  await logInfo("app", "Yarrtorio starting up", { version: app.getVersion() });

  const settingsService = createSettingsService();
  registerIpc(settingsService);
  createMainWindow();

  await logInfo("app", "Yarrtorio initialized successfully");

  app.on("activate", () => {
    if (process.platform !== "darwin") {
      return;
    }
    createMainWindow();
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  app.on("before-quit", async () => {
    await logInfo("app", "Yarrtorio shutting down");
  });
}
