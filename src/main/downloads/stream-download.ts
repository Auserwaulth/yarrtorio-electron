import { createWriteStream } from "node:fs";
import { open, rename, unlink } from "node:fs/promises";
import type { DownloadProgress } from "@shared/types/mod";

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

export async function cleanupTemp(filePath: string): Promise<void> {
  await unlink(`${filePath}.part`).catch(() => undefined);
}
