import { app } from "electron";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

interface CacheEnvelope<T> {
  expiresAt: number;
  data: T;
}

const cacheDirectory = join(app.getPath("userData"), "cache", "mods");

function hashKey(key: string): string {
  return createHash("sha1").update(key).digest("hex");
}

async function getCachePath(key: string): Promise<string> {
  await mkdir(cacheDirectory, { recursive: true });
  return join(cacheDirectory, `${hashKey(key)}.json`);
}

export async function readCache<T>(key: string): Promise<T | null> {
  try {
    const path = await getCachePath(key);
    const raw = await readFile(path, "utf8");
    const parsed = JSON.parse(raw) as CacheEnvelope<T>;

    if (Date.now() > parsed.expiresAt) {
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
}

export async function writeCache<T>(
  key: string,
  data: T,
  ttlMs: number,
): Promise<void> {
  const path = await getCachePath(key);
  const payload: CacheEnvelope<T> = {
    expiresAt: Date.now() + ttlMs,
    data,
  };

  await writeFile(path, JSON.stringify(payload), "utf8");
}
