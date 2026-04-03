import { spawn } from "node:child_process";
import { stat } from "node:fs/promises";
import { isAbsolute, resolve } from "node:path";
import type { IpcMainInvokeEvent } from "electron";
import type { OperationResult } from "@shared/types/mod";
import { logInfo, logError } from "../../logging/logger";
import type { SettingsService } from "../../services/settings-service";

async function resolveFactorioPath(
  settingsService: SettingsService,
): Promise<string> {
  const settings = await settingsService.getSettings();

  if (!settings.factorioPath) {
    throw new Error("Factorio path is not configured.");
  }

  if (!isAbsolute(settings.factorioPath.trim())) {
    throw new Error("Factorio executable path must be absolute.");
  }

  const factorioPath = resolve(settings.factorioPath);
  const fileStat = await stat(factorioPath);
  if (!fileStat.isFile()) {
    throw new Error("Factorio executable is not a file.");
  }

  return factorioPath;
}

export function createLaunchHandler(settingsService: SettingsService) {
  return {
    launchFactorio: async (
      _event: IpcMainInvokeEvent,
    ): Promise<OperationResult<boolean>> => {
      try {
        const factorioPath = await resolveFactorioPath(settingsService);

        await logInfo("launch", "Launching Factorio", factorioPath);

        const factorio = spawn(factorioPath, [], {
          detached: true,
          stdio: "ignore",
        });

        factorio.unref();

        await logInfo("launch", "Factorio launched successfully", factorioPath);

        return { ok: true, data: true };
      } catch (error) {
        await logError("launch", "Failed to launch Factorio", error);

        return {
          ok: false,
          error: "Configured Factorio executable is unavailable.",
        };
      }
    },
  };
}
