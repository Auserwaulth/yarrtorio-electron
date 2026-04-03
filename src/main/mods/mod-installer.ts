import { readdir, unlink } from "node:fs/promises";
import { basename, join } from "node:path";
import type { InstalledMod } from "@shared/types/mod";
import { ensureAccessibleModsFolder } from "./mod-paths";

const archivePattern =
  /^(?<name>.+)_(?<version>\d+\.\d+\.\d+(?:[-+.\w]*)?)\.zip$/i;

export async function listInstalledMods(
  modsFolder: string,
): Promise<InstalledMod[]> {
  const resolvedFolder = await ensureAccessibleModsFolder(modsFolder);
  const entries = await readdir(resolvedFolder, { withFileTypes: true });
  return entries
    .filter(
      (entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".zip"),
    )
    .map((entry) => {
      const match = archivePattern.exec(entry.name);
      const name = match?.groups?.name ?? basename(entry.name, ".zip");
      const version = match?.groups?.version ?? "unknown";
      return {
        name,
        version,
        fileName: entry.name,
        filePath: join(resolvedFolder, entry.name),
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

export async function deleteInstalledArchive(filePath: string): Promise<void> {
  await unlink(filePath);
}
