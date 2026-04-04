import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { modListEntrySchema } from "../../shared/validation/schemas.ts";
import type {
  ModListEntry,
  ModListProfile,
  ModListProfileComparison,
} from "../../shared/types/mod.ts";
import { z } from "zod";

const BASE_MOD_NAME = "base";

const profileExportPackageSchema = z
  .object({
    version: z.literal(1),
    profile: z.object({
      name: z.string().trim().min(1),
    }),
    mods: z.array(modListEntrySchema),
  })
  .strict();

function normalizeProfileMods(mods: ModListEntry[]): ModListEntry[] {
  const hasBase = mods.some((mod) => mod.name === BASE_MOD_NAME);
  return hasBase ? mods : [{ name: BASE_MOD_NAME, enabled: true }, ...mods];
}

function ensureUniqueModNames(mods: ModListEntry[]): void {
  const seen = new Set<string>();

  for (const mod of mods) {
    if (seen.has(mod.name)) {
      throw new Error("Profile file contains duplicate mod entries.");
    }

    seen.add(mod.name);
  }
}

async function preserveCorruptProfileFile(filePath: string): Promise<void> {
  const backupPath = `${filePath}.corrupt-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;

  await copyFile(filePath, backupPath).catch(() => undefined);
}

export function buildUniqueProfileName(
  existingNames: string[],
  desiredName: string,
): string {
  const baseName = desiredName.trim() || "Imported profile";

  if (!existingNames.includes(baseName)) {
    return baseName;
  }

  let counter = 2;
  let nextName = `${baseName} (${counter})`;

  while (existingNames.includes(nextName)) {
    counter += 1;
    nextName = `${baseName} (${counter})`;
  }

  return nextName;
}

export function sanitizeProfileFileName(name: string): string {
  const trimmed = name.trim() || "profile";
  return trimmed.replace(/[\\/:*?"<>|]+/g, "_");
}

export async function readProfileStorageMods(
  filePath: string,
): Promise<ModListEntry[]> {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = z
      .object({
        mods: z.array(modListEntrySchema),
      })
      .parse(JSON.parse(raw));

    ensureUniqueModNames(parsed.mods);

    return normalizeProfileMods(parsed.mods);
  } catch {
    await preserveCorruptProfileFile(filePath);
    throw new Error(
      "Profile storage file is invalid. A backup copy was preserved.",
    );
  }
}

export async function writeProfileStorageMods(
  filePath: string,
  mods: ModListEntry[],
): Promise<void> {
  const normalized = normalizeProfileMods(mods);
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(
    filePath,
    JSON.stringify({ mods: normalized }, null, 2),
    "utf8",
  );
}

export async function readProfileExportPackage(filePath: string): Promise<{
  version: 1;
  profile: {
    name: string;
  };
  mods: ModListEntry[];
}> {
  const raw = await readFile(filePath, "utf8");
  const parsed = profileExportPackageSchema.parse(JSON.parse(raw));
  ensureUniqueModNames(parsed.mods);
  return {
    version: parsed.version,
    profile: {
      name: parsed.profile.name,
    },
    mods: normalizeProfileMods(parsed.mods),
  };
}

export async function writeProfileExportPackage(
  filePath: string,
  profileName: string,
  mods: ModListEntry[],
): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(
    filePath,
    JSON.stringify(
      {
        version: 1,
        profile: {
          name: profileName.trim() || "Imported profile",
        },
        mods: normalizeProfileMods(mods),
      },
      null,
      2,
    ),
    "utf8",
  );
}

function isSameModEntry(left: ModListEntry, right: ModListEntry): boolean {
  return (
    left.name === right.name &&
    left.enabled === right.enabled &&
    (left.version ?? null) === (right.version ?? null)
  );
}

export function compareProfileContents(
  leftProfile: ModListProfile,
  rightProfile: ModListProfile,
  leftMods: ModListEntry[],
  rightMods: ModListEntry[],
): ModListProfileComparison {
  const leftMap = new Map(leftMods.map((mod) => [mod.name, mod]));
  const rightMap = new Map(rightMods.map((mod) => [mod.name, mod]));
  const allNames = Array.from(
    new Set([...leftMap.keys(), ...rightMap.keys()]),
  ).sort((left, right) => left.localeCompare(right));

  const added: ModListProfileComparison["added"] = [];
  const removed: ModListProfileComparison["removed"] = [];
  const changed: ModListProfileComparison["changed"] = [];
  let sameCount = 0;

  for (const name of allNames) {
    const left = leftMap.get(name);
    const right = rightMap.get(name);

    if (left && right) {
      if (isSameModEntry(left, right)) {
        sameCount += 1;
      } else {
        changed.push({ name, left, right });
      }
      continue;
    }

    if (left) {
      removed.push({ name, left });
      continue;
    }

    if (right) {
      added.push({ name, right });
    }
  }

  return {
    leftProfile,
    rightProfile,
    leftCount: leftMods.length,
    rightCount: rightMods.length,
    sameCount,
    added,
    removed,
    changed,
  };
}
