import { spawn } from "node:child_process";
import type { IpcMainInvokeEvent } from "electron";
import type { OperationResult } from "@shared/types/mod";
import { logInfo, logError } from "../../logging/logger";

export function createLaunchHandler() {
  return {
    launchFactorio: async (
      _event: IpcMainInvokeEvent,
      factorioPath: string,
    ): Promise<OperationResult<boolean>> => {
      if (!factorioPath) {
        return { ok: false, error: "Factorio path not set." };
      }

      try {
        await logInfo(
          "launch",
          "Launching Factorio",
          factorioPath,
        );

        const factorio = spawn(factorioPath, [], {
          detached: true,
          stdio: "ignore",
        });

        factorio.unref();

        await logInfo(
          "launch",
          "Factorio launched successfully",
          factorioPath,
        );

        return { ok: true, data: true };
      } catch (error) {
        const errorMessage = error instanceof Error
          ? error.message
          : "Failed to launch Factorio";

        await logError(
          "launch",
          "Failed to launch Factorio",
          error,
          { factorioPath },
        );

        return {
          ok: false,
          error: errorMessage,
        };
      }
    },
  };
}