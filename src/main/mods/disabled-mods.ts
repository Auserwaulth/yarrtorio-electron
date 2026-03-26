import { DEFAULT_SKIP_MODS } from "@shared/constants";
import type { ModListEntry } from "@shared/types/mod";

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
  return entries.filter((entry) => {
    if (
      DEFAULT_SKIP_MODS.includes(
        entry.name as (typeof DEFAULT_SKIP_MODS)[number],
      )
    ) {
      return false;
    }
    return includeDisabled ? true : entry.enabled;
  });
}
