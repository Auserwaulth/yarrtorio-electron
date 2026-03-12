import { app } from "electron";
import type { AppMeta } from "@shared/types/app-meta";
import type { OperationResult } from "@shared/types/mod";
import { getLogFilePath } from "../../logging/logger";

export function createAppHandler() {
  return {
    meta: async (): Promise<OperationResult<AppMeta>> => {
      return {
        ok: true,
        data: {
          name: app.getName(),
          version: app.getVersion(),
          logPath: getLogFilePath(),
        },
      };
    },
  };
}
