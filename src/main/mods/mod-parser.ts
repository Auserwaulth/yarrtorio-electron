import { app } from "electron";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { modListFileSchema } from "@shared/validation/schemas";
import type {
  AppSettings,
  ModListEntry,
  ModListProfile,
} from "@shared/types/mod";

const MOD_LIST_PROFILES_DIR = "mod-list-profiles";

function getDefaultModList(mods: ModListEntry[] = []): ModListEntry[] {
  const hasBase = mods.some((mod) => mod.name === "base");
  return hasBase ? mods : [{ name: "base", enabled: true }, ...mods];
}

function getProfilesDirectory(): string {
  return join(app.getPath("userData"), MOD_LIST_PROFILES_DIR);
}

function resolveProfileStoragePath(profileId: string): string {
  return join(getProfilesDirectory(), `${profileId}.json`);
}

export function resolveModListPath(
  settings: Pick<AppSettings, "modsFolder">,
): string {
  return join(settings.modsFolder, "mod-list.json");
}

export function getActiveModListProfile(
  settings: Pick<AppSettings, "modListProfiles" | "activeModListProfileId">,
): ModListProfile | null {
  return (
    settings.modListProfiles.find(
      (profile) => profile.id === settings.activeModListProfileId,
    ) ??
    settings.modListProfiles[0] ??
    null
  );
}

async function writeModListFile(
  filePath: string,
  mods: ModListEntry[],
): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(
    filePath,
    JSON.stringify({ mods: getDefaultModList(mods) }, null, 2),
    "utf8",
  );
}

async function ensureModListFile(filePath: string): Promise<void> {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = modListFileSchema.parse(JSON.parse(raw));
    const normalized = getDefaultModList(parsed.mods);

    if (normalized.length !== parsed.mods.length) {
      await writeModListFile(filePath, normalized);
    }
  } catch {
    await writeModListFile(filePath, [{ name: "base", enabled: true }]);
  }
}

async function parseModListFile(filePath: string): Promise<ModListEntry[]> {
  await ensureModListFile(filePath);
  const raw = await readFile(filePath, "utf8");
  const parsed = modListFileSchema.parse(JSON.parse(raw));
  return getDefaultModList(parsed.mods);
}

export async function ensureActiveModListExists(
  settings: Pick<AppSettings, "modsFolder">,
): Promise<string> {
  const filePath = resolveModListPath(settings);
  await ensureModListFile(filePath);
  return filePath;
}

export async function ensureProfileStorageExists(
  profileId: string,
): Promise<string> {
  const filePath = resolveProfileStoragePath(profileId);
  await ensureModListFile(filePath);
  return filePath;
}

export async function parseModList(
  settings: Pick<AppSettings, "modsFolder">,
): Promise<ModListEntry[]> {
  return parseModListFile(await ensureActiveModListExists(settings));
}

export async function writeModList(
  settings: Pick<
    AppSettings,
    "modsFolder" | "modListProfiles" | "activeModListProfileId"
  >,
  mods: ModListEntry[],
): Promise<void> {
  const normalized = getDefaultModList(mods);
  const activePath = resolveModListPath(settings);
  await writeModListFile(activePath, normalized);

  const activeProfile = getActiveModListProfile(settings);
  if (activeProfile) {
    await writeModListFile(
      resolveProfileStoragePath(activeProfile.id),
      normalized,
    );
  }
}

export async function upsertModListEntry(
  settings: Pick<
    AppSettings,
    "modsFolder" | "modListProfiles" | "activeModListProfileId"
  >,
  entry: ModListEntry,
): Promise<void> {
  let mods: ModListEntry[] = [];
  try {
    mods = await parseModList(settings);
  } catch {
    mods = [];
  }

  const index = mods.findIndex((item) => item.name === entry.name);
  if (index >= 0) {
    mods[index] = entry;
  } else {
    mods.push(entry);
  }

  await writeModList(
    settings,
    mods.sort((left, right) => left.name.localeCompare(right.name)),
  );
}

export async function removeModListEntry(
  settings: Pick<
    AppSettings,
    "modsFolder" | "modListProfiles" | "activeModListProfileId"
  >,
  modName: string,
): Promise<void> {
  let mods: ModListEntry[] = [];
  try {
    mods = await parseModList(settings);
  } catch (error) {
    console.error("Failed to parse mod list:", error);
    return;
  }

  await writeModList(
    settings,
    mods.filter((item) => item.name !== modName),
  );
}

export async function createModListProfileStorage(
  settings: Pick<AppSettings, "modsFolder">,
  profileId: string,
): Promise<void> {
  const activeMods = await parseModList(settings).catch(() => [
    { name: "base", enabled: true },
  ]);
  await writeModListFile(resolveProfileStoragePath(profileId), activeMods);
}

export async function renameModListProfileStorage(
  _profileId: string,
): Promise<void> {
  return Promise.resolve();
}

export async function deleteModListProfileStorage(
  profileId: string,
): Promise<void> {
  await rm(resolveProfileStoragePath(profileId), { force: true });
}

export async function switchActiveModListProfile(
  settings: Pick<
    AppSettings,
    "modsFolder" | "modListProfiles" | "activeModListProfileId"
  >,
  nextProfileId: string,
): Promise<void> {
  const currentProfile = getActiveModListProfile(settings);
  if (currentProfile) {
    const activeMods = await parseModList(settings).catch(() => [
      { name: "base", enabled: true },
    ]);
    await writeModListFile(
      resolveProfileStoragePath(currentProfile.id),
      activeMods,
    );
  }

  const nextProfilePath = await ensureProfileStorageExists(nextProfileId);
  const nextMods = await parseModListFile(nextProfilePath);
  await writeModListFile(resolveModListPath(settings), nextMods);
}
