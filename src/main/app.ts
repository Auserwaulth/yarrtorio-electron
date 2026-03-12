import { app } from "electron";
import { createMainWindow } from "./windows/main-window";
import { registerIpc } from "./ipc/register-ipc";
import { createSettingsService } from "./services/settings-service";
import { APP_USER_MODEL_ID } from "@shared/constants";

export async function createApp(): Promise<void> {
  if (process.platform === "win32") {
    app.setAppUserModelId(APP_USER_MODEL_ID);
  }

  await app.whenReady();

  const settingsService = createSettingsService();
  registerIpc(settingsService);
  createMainWindow();

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
}
