import type {
  BrowseFilters,
  FactorioVersion,
  ModCategory,
  ModTag,
} from "@shared/types/mod";

/**
 * Props for the ModFilters component
 */
export interface ModFiltersProps {
  /** Current filter values */
  filters: BrowseFilters;
  /** Whether filters are being applied (loading state) */
  busy?: boolean;
  /** Callback when search query changes */
  onQueryChange(value: string): void;
  /** Callback when Factorio version changes */
  onVersionChange(value: FactorioVersion): void;
  /** Callback when a category filter is toggled */
  onToggleCategory(value: ModCategory): void;
  /** Callback when a tag filter is toggled */
  onToggleTag(value: ModTag): void;
  /** Callback when category inclusion setting changes */
  onIncludeCategoriesChange(value: boolean): void;
  /** Callback when tag inclusion setting changes */
  onIncludeTagsChange(value: boolean): void;
  /** Callback when include deprecated setting changes */
  onIncludeDeprecatedChange(value: boolean): void;
  /** Callback to reset all filters to defaults */
  onReset(): void;
  /** Callback to apply filters and search */
  onSubmit(): void;
}
