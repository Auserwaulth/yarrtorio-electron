import { createWriteStream } from "node:fs";
import { open, rename, unlink } from "node:fs/promises";
import type { DownloadProgress } from "@shared/types/mod";

/**
 * Streams a remote archive to disk and reports incremental byte progress.
 *
 * Bytes are written to `destination + ".part"` first and renamed to the final
 * destination only after the download completes successfully. On failure, the
 * partial file is removed before the error is rethrown.
 *
 * @param url - Remote archive URL.
 * @param destination - Final staging file path without the `.part` suffix.
 * @param onProgress - Callback receiving partial progress fields to merge into
 * the active download item.
 */
export async function streamDownload(
  url: string,
  destination: string,
  onProgress: (update: Partial<DownloadProgress>) => void,
): Promise<void> {
  const response = await fetch(url, {
    headers: { "User-Agent": "Yarrtorio/0.1.0" },
  });

  if (!response.ok || !response.body) {
    throw new Error(`Download failed with ${response.status}`);
  }

  const totalBytes = Number(response.headers.get("content-length") ?? 0);
  let transferredBytes = 0;

  const tempPath = `${destination}.part`;
  const writer = createWriteStream(tempPath);

  try {
    const reader = response.body.getReader();

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      transferredBytes += value.byteLength;
      onProgress({
        transferredBytes,
        totalBytes,
        percent:
          totalBytes > 0
            ? Math.round((transferredBytes / totalBytes) * 100)
            : 0,
      });

      await new Promise<void>((resolve, reject) => {
        writer.write(value, (error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }

    await new Promise<void>((resolve, reject) => {
      writer.end((error?: Error | null) => {
        if (error) reject(error);
        else resolve();
      });
    });

    await rename(tempPath, destination);
  } catch (error) {
    writer.destroy();
    await unlink(tempPath).catch(() => undefined);
    throw error;
  }
}

/**
 * Performs a minimal ZIP signature check against the downloaded file.
 *
 * This validates that the file begins with the `PK` ZIP signature. It is meant
 * to catch obvious corruption or unexpected responses, not to fully verify ZIP
 * integrity.
 *
 * @param filePath - Archive file path to inspect.
 */
export async function validateZip(filePath: string): Promise<void> {
  const handle = await open(filePath, "r");

  try {
    const buffer = Buffer.alloc(4);
    await handle.read(buffer, 0, 4, 0);

    if (buffer.toString("binary", 0, 2) !== "PK") {
      throw new Error("Downloaded file is not a ZIP archive.");
    }
  } finally {
    await handle.close();
  }
}

/**
 * Removes the partial download file created by `streamDownload`, if present.
 *
 * @param filePath - Base destination path used for the download.
 */
export async function cleanupTemp(filePath: string): Promise<void> {
  await unlink(`${filePath}.part`).catch(() => undefined);
  await unlink(filePath).catch(() => undefined);
}
