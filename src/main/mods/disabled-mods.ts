import { DEFAULT_SKIP_MODS } from "../../shared/constants/index.ts";
import type { ModListEntry } from "../../shared/types/mod.ts";

export function isManagedModName(name: string): boolean {
  return !DEFAULT_SKIP_MODS.includes(
    name as (typeof DEFAULT_SKIP_MODS)[number],
  );
}

export function filterSyncCandidates(entries: ModListEntry[]): ModListEntry[] {
  return entries.filter((entry) => isManagedModName(entry.name));
}

/**
 * Filters out mods that should not be managed by the app.
 *
 * Built-in Factorio mods are always skipped, and disabled entries are removed
 * unless the caller explicitly wants them included.
 */
export function filterManagedMods(
  entries: ModListEntry[],
  includeDisabled: boolean,
): ModListEntry[] {
  return entries.filter(
    (entry) =>
      isManagedModName(entry.name) && (includeDisabled || entry.enabled),
  );
}
