import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { modListFileSchema } from "@shared/validation/schemas";
import type { AppSettings, ModListEntry } from "@shared/types/mod";

function resolveModListPath(
  settings: Pick<AppSettings, "modsFolder" | "modListPath">,
): string {
  return (
    settings.modListPath.trim() || join(settings.modsFolder, "mod-list.json")
  );
}

async function ensureModListExists(
  settings: Pick<AppSettings, "modsFolder" | "modListPath">,
): Promise<string> {
  const filePath = resolveModListPath(settings);

  await mkdir(dirname(filePath), { recursive: true });

  try {
    await readFile(filePath, "utf8");
  } catch {
    await writeFile(
      filePath,
      JSON.stringify(
        {
          mods: [{ name: "base", enabled: true }],
        },
        null,
        2,
      ),
      "utf8",
    );
  }

  return filePath;
}

export async function parseModList(
  settings: Pick<AppSettings, "modsFolder" | "modListPath">,
): Promise<ModListEntry[]> {
  const filePath = await ensureModListExists(settings);
  const raw = await readFile(filePath, "utf8");
  const parsed = modListFileSchema.parse(JSON.parse(raw));

  const hasBase = parsed.mods.some((mod) => mod.name === "base");
  if (!hasBase) {
    const nextMods = [{ name: "base", enabled: true }, ...parsed.mods];
    await writeModList(settings, nextMods);
    return nextMods;
  }

  return parsed.mods;
}

export async function writeModList(
  settings: Pick<AppSettings, "modsFolder" | "modListPath">,
  mods: ModListEntry[],
): Promise<void> {
  const filePath = resolveModListPath(settings);
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify({ mods }, null, 2), "utf8");
}

export async function upsertModListEntry(
  settings: Pick<AppSettings, "modsFolder" | "modListPath">,
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
  settings: Pick<AppSettings, "modsFolder" | "modListPath">,
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
