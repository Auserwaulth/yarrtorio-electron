import { stat } from "node:fs/promises";
import { basename, isAbsolute, relative, resolve } from "node:path";

function isMissingFileError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "ENOENT"
  );
}

export function ensureConfiguredModsFolder(modsFolder: string): string {
  const trimmedFolder = modsFolder.trim();

  if (!trimmedFolder) {
    throw new Error("Mods folder is not configured.");
  }

  if (!isAbsolute(trimmedFolder)) {
    throw new Error("Configured mods folder must be an absolute path.");
  }

  return resolve(trimmedFolder);
}

export async function ensureAccessibleModsFolder(
  modsFolder: string,
): Promise<string> {
  const resolvedFolder = ensureConfiguredModsFolder(modsFolder);

  try {
    const folderStat = await stat(resolvedFolder);
    if (!folderStat.isDirectory()) {
      throw new Error("Configured mods folder is unavailable.");
    }
  } catch (error) {
    if (isMissingFileError(error)) {
      throw new Error("Configured mods folder is unavailable.");
    }

    throw new Error("Configured mods folder is unavailable.");
  }

  return resolvedFolder;
}

export function resolvePathWithinFolder(
  folder: string,
  candidatePath: string,
  errorMessage = "Path must stay inside the configured mods folder.",
): string {
  const resolvedFolder = ensureConfiguredModsFolder(folder);
  const resolvedCandidate = resolve(resolvedFolder, candidatePath);
  const folderRelative = relative(resolvedFolder, resolvedCandidate);

  if (
    folderRelative === "" ||
    (!folderRelative.startsWith("..") && !isAbsolute(folderRelative))
  ) {
    return resolvedCandidate;
  }

  throw new Error(errorMessage);
}

export function resolveArchivePathWithinFolder(
  folder: string,
  fileName: string,
): string {
  const trimmedFileName = fileName.trim();

  if (!trimmedFileName) {
    throw new Error("Mod archive file name is required.");
  }

  if (trimmedFileName !== basename(trimmedFileName)) {
    throw new Error(
      "Mod archive path must stay inside the configured mods folder.",
    );
  }

  if (!trimmedFileName.toLowerCase().endsWith(".zip")) {
    throw new Error("Mod archive must be a .zip file.");
  }

  return resolvePathWithinFolder(
    folder,
    trimmedFileName,
    "Mod archive path must stay inside the configured mods folder.",
  );
}
