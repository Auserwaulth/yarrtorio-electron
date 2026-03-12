import type {
  BrowseFilters,
  FactorioVersion,
  ModCategory,
  ModTag,
} from "@shared/types/mod";

export interface ModFiltersProps {
  filters: BrowseFilters;
  busy?: boolean;
  onQueryChange(value: string): void;
  onVersionChange(value: FactorioVersion): void;
  onToggleCategory(value: ModCategory): void;
  onToggleTag(value: ModTag): void;
  onIncludeCategoriesChange(value: boolean): void;
  onIncludeTagsChange(value: boolean): void;
  onIncludeDeprecatedChange(value: boolean): void;
  onReset(): void;
  onSubmit(): void;
}
