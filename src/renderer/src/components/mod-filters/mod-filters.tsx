import { useState } from "react";
import {
  factorioVersions,
  modCategories,
  // modTags,
  type ModCategory,
  // type ModTag,
} from "@shared/types/mod";
import type { ModFiltersProps } from "./mod-filters.types";

/**
 * Converts a string to title case (e.g., "most-downloaded" -> "Most Downloaded")
 * @param value - The string to titleize
 * @returns The titleized string
 */
function titleize(value: string): string {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/**
 * A toggleable filter chip component.
 * @template T - The type of filter values
 */
function FilterChip<T extends string>({
  value,
  selected,
  onToggle,
}: {
  value: T;
  selected: boolean;
  onToggle(value: T): void;
}) {
  return (
    <button
      type="button"
      className={`badge h-auto min-h-8 cursor-pointer px-3 py-2 transition-all duration-200 ${
        selected ? "badge-primary" : "badge-outline hover:badge-primary/20"
      }`}
      onClick={() => onToggle(value)}
    >
      {titleize(value)}
    </button>
  );
}

/**
 * A chevron icon component that rotates based on open state.
 * @param props - Component props
 * @param props.open - Whether the section is open (controls rotation)
 */
function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 transition-transform duration-300 ${
        open ? "rotate-180" : ""
      }`}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.512a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/**
 * A collapsible section component for filter groups.
 * @template T - The type of filter values
 */
function CollapsibleFilterSection<T extends string>({
  title,
  subtitle,
  includeChecked,
  onIncludeChange,
  values,
  selectedValues,
  onToggleValue,
  defaultOpen = true,
}: {
  title: string;
  subtitle: string;
  includeChecked: boolean;
  onIncludeChange(checked: boolean): void;
  values: readonly T[];
  selectedValues: readonly T[];
  onToggleValue(value: T): void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-base-300 bg-base-200/60 rounded-2xl border">
      <div className="flex items-start justify-between gap-3 p-4 pb-3">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex min-w-0 flex-1 items-start gap-3 text-left"
          aria-expanded={open}
        >
          <Chevron open={open} />
          <div className="min-w-0">
            <p className="font-semibold">{title}</p>
            <p className="text-base-content/60 text-xs">{subtitle}</p>
          </div>
        </button>

        <label
          className="label cursor-pointer gap-2 py-0"
          onClick={(event) => event.stopPropagation()}
        >
          <span className="label-text text-xs">Include</span>
          <input
            type="checkbox"
            className="toggle toggle-primary toggle-sm"
            checked={includeChecked}
            onChange={(event) => onIncludeChange(event.target.checked)}
          />
        </label>
      </div>

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4">
            <div className="flex flex-wrap gap-2 pt-1">
              {values.map((value) => (
                <FilterChip<T>
                  key={value}
                  value={value}
                  selected={selectedValues.includes(value)}
                  onToggle={onToggleValue}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * A filter component for browsing Factorio mods.
 * Provides search, Factorio version selection, category filters,
 * and options to include deprecated mods.
 *
 * @param props - Component props
 * @param props.filters - Current filter values
 * @param props.busy - Loading state while applying filters
 * @param props.onQueryChange - Search query change callback
 * @param props.onVersionChange - Factorio version change callback
 * @param props.onToggleCategory - Category toggle callback
 * @param props.onToggleTag - Tag toggle callback
 * @param props.onIncludeCategoriesChange - Category inclusion toggle callback
 * @param props.onIncludeTagsChange - Tag inclusion toggle callback
 * @param props.onIncludeDeprecatedChange - Include deprecated toggle callback
 * @param props.onReset - Reset filters callback
 * @param props.onSubmit - Apply filters callback
 *
 * @example
 * <ModFilters
 *   filters={currentFilters}
 *   busy={isLoading}
 *   onQueryChange={setQuery}
 *   onVersionChange={setVersion}
 *   onReset={() => resetFilters()}
 *   onSubmit={() => applyFilters()}
 * />
 */
export function ModFilters(props: ModFiltersProps) {
  const { filters } = props;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <div className="space-y-4">
        <label className="input input-bordered flex w-full items-center gap-2">
          <input
            className="grow"
            value={filters.query}
            onChange={(event) => props.onQueryChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                props.onSubmit();
              }
            }}
            placeholder='Search mods, owners, or exact phrases like "space age"'
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Factorio version</legend>
            <select
              className="select select-bordered w-full"
              value={filters.version}
              onChange={(event) =>
                props.onVersionChange(
                  event.target.value as (typeof factorioVersions)[number],
                )
              }
            >
              {factorioVersions.map((version) => (
                <option key={version} value={version}>
                  {version}
                </option>
              ))}
            </select>
          </fieldset>

          <div className="border-base-300 bg-base-200/60 space-y-3 rounded-2xl border p-4">
            <label className="label cursor-pointer justify-start gap-3">
              <input
                type="checkbox"
                className="checkbox checkbox-primary"
                checked={filters.includeDeprecated}
                onChange={(event) =>
                  props.onIncludeDeprecatedChange(event.target.checked)
                }
              />
              <span className="label-text">Include deprecated mods</span>
            </label>

            <div className="flex gap-2">
              <button
                className="btn btn-outline btn-sm"
                type="button"
                onClick={props.onReset}
              >
                Reset filters
              </button>
              <button
                className="btn btn-primary btn-sm"
                disabled={props.busy}
                type="button"
                onClick={props.onSubmit}
              >
                {props.busy ? "Loading..." : "Apply"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-1">
        <CollapsibleFilterSection<ModCategory>
          title="Categories"
          subtitle="Match any selected category."
          includeChecked={filters.includeCategories}
          onIncludeChange={props.onIncludeCategoriesChange}
          values={modCategories}
          selectedValues={filters.categories}
          onToggleValue={props.onToggleCategory}
          defaultOpen={false}
        />
        <CollapsibleFilterSection<ModTag>
          title="Tags"
          subtitle="Match any selected tag."
          includeChecked={filters.includeTags}
          onIncludeChange={props.onIncludeTagsChange}
          values={modTags}
          selectedValues={filters.tags}
          onToggleValue={props.onToggleTag}
          defaultOpen={false}
        />
      </div> */}
      <div className="grid items-start gap-4 xl:grid-cols-1">
        <CollapsibleFilterSection<ModCategory>
          title="Categories"
          subtitle="Match any selected category."
          includeChecked={filters.includeCategories}
          onIncludeChange={props.onIncludeCategoriesChange}
          values={modCategories}
          selectedValues={filters.categories}
          onToggleValue={props.onToggleCategory}
          defaultOpen={false}
        />
      </div>
    </div>
  );
}
