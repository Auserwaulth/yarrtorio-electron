import { ModSummary, BrowseFilters } from "@shared/types/mod";

/**
 * Checks a mod summary against the free-text browse query.
 *
 * The query supports quoted phrases as well as unquoted terms, and all terms
 * must match somewhere across the searchable fields.
 */
export function filterByQuery(mod: ModSummary, query: string): boolean {
  if (!query) return true;

  const haystacks = [
    mod.name,
    mod.title,
    mod.summary,
    mod.owner,
    mod.category ?? "",
    ...mod.tags,
  ].map((value) => value.toLowerCase());

  const phrases = Array.from(query.matchAll(/"([^"]+)"/g)).map((match) =>
    (match[1] ?? "").trim().toLowerCase(),
  );
  const remainder = query
    .replace(/"([^"]+)"/g, " ")
    .trim()
    .toLowerCase();
  const terms = remainder ? remainder.split(/\s+/) : [];

  return [...phrases, ...terms].every((part) =>
    haystacks.some((value) => value.includes(part)),
  );
}

/**
 * Applies inclusion or exclusion selection rules to a set of values.
 *
 * When `include` is true, at least one selected value must be present. When it
 * is false, any match causes the item to be filtered out.
 */
export function filterBySelection<T extends string>(
  values: readonly T[],
  selected: readonly T[],
  include: boolean,
): boolean {
  if (selected.length === 0) return true;

  const hasMatch = selected.some((value) => values.includes(value));
  return include ? hasMatch : !hasMatch;
}

/**
 * Applies the full browse filter set to a list of mods.
 *
 * Query, category, and tag filters are all evaluated after trimming the search
 * string so the renderer can work with a normalized filter state.
 */
export function applyBrowseFilters(
  mods: ModSummary[],
  filters: BrowseFilters,
): ModSummary[] {
  const trimmedQuery = filters.query.trim();

  return mods.filter((mod) => {
    const categoryValues = mod.category ? [mod.category] : [];

    return (
      filterByQuery(mod, trimmedQuery) &&
      filterBySelection(
        categoryValues,
        filters.categories,
        filters.includeCategories,
      ) &&
      filterBySelection(mod.tags, filters.tags, filters.includeTags)
    );
  });
}
