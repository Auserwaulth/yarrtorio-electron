import { shell } from "electron";
import { logError } from "../../logging/logger";

function isSafeExternalUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function createExternalHandler() {
  return {
    async openUrl(_: Electron.IpcMainInvokeEvent, url: string): Promise<void> {
      if (!isSafeExternalUrl(url)) {
        throw new Error("Blocked unsafe external URL.");
      }

      await shell.openExternal(url);
    },
    async openPath(
      _: Electron.IpcMainInvokeEvent,
      path: string,
    ): Promise<string> {
      const result = await shell.openPath(path);

      if (result) {
        await logError("external", "Failed to open local path.", {
          path,
          result,
        });
      }

      return result;
    },
  };
}
