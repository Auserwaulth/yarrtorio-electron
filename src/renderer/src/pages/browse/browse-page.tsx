import { BentoTile } from "../../components/bento-tile";
import { ModCard, ModCardSkeleton } from "../../components/mod-card";
import { ModFilters } from "../../components/mod-filters";
import { BrowseTabs } from "../../components/browse-tabs";
import type {
  BrowseFilters,
  BrowsePagination,
  ModSummary,
} from "@shared/types/mod";

interface BrowsePageProps {
  mods: ModSummary[];
  filters: BrowseFilters;
  pagination: BrowsePagination | null;
  busy: boolean;
  onQueryChange(value: string): void;
  onVersionChange(value: BrowseFilters["version"]): void;
  onToggleCategory(value: BrowseFilters["categories"][number]): void;
  onToggleTag(value: BrowseFilters["tags"][number]): void;
  onIncludeCategoriesChange(value: boolean): void;
  onIncludeTagsChange(value: boolean): void;
  onIncludeDeprecatedChange(value: boolean): void;
  onTabChange(value: BrowseFilters["tab"]): void;
  onApply(page?: number): void;
  onReset(): void;
  onOpen(modName: string): void;
  onDownload(modName: string, version?: string): void;
  onSyncFromModList(): void;
}

const paginationComponent = (
  pagination: BrowsePagination,
  busy: boolean,
  onApply: (page: number) => void,
) => (
  <div className="border-base-300 bg-base-100 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-2 pl-4">
    <p className="text-base-content/70 text-sm">
      Page {pagination.page} of {pagination.pageCount} · {pagination.count}{" "}
      result
      {pagination.count === 1 ? "" : "s"}
    </p>
    <div className="join">
      <button
        className="btn btn-sm join-item"
        disabled={!pagination.hasPrev || busy}
        onClick={() => onApply(pagination.page - 1)}
      >
        Previous
      </button>
      <button
        className="btn btn-sm join-item"
        disabled={!pagination.hasNext || busy}
        onClick={() => onApply(pagination.page + 1)}
      >
        Next
      </button>
    </div>
  </div>
);

export function BrowsePage(props: BrowsePageProps) {
  return (
    <div className="space-y-4">
      <BentoTile
        title="Mod browser"
        action={
          <button
            className="btn btn-secondary btn-sm"
            onClick={props.onSyncFromModList}
          >
            Sync from mod-list
          </button>
        }
      >
        <div className="space-y-4">
          <BrowseTabs value={props.filters.tab} onChange={props.onTabChange} />
          <ModFilters
            filters={props.filters}
            onQueryChange={props.onQueryChange}
            onVersionChange={props.onVersionChange}
            onToggleCategory={props.onToggleCategory}
            onToggleTag={props.onToggleTag}
            onIncludeCategoriesChange={props.onIncludeCategoriesChange}
            onIncludeTagsChange={props.onIncludeTagsChange}
            onIncludeDeprecatedChange={props.onIncludeDeprecatedChange}
            onReset={props.onReset}
            onSubmit={() => props.onApply(1)}
            busy={props.busy}
          />
        </div>
      </BentoTile>

      {props.pagination &&
        paginationComponent(props.pagination, props.busy, props.onApply)}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {props.busy
          ? Array.from({ length: 12 }).map((_, i) => (
              <ModCardSkeleton key={i} />
            ))
          : props.mods.map((mod) => (
              <ModCard
                key={mod.name}
                mod={mod}
                onOpen={props.onOpen}
                onDownload={props.onDownload}
              />
            ))}
      </div>

      {!props.busy && props.mods.length === 0 && (
        <div className="bg-base-200 rounded-xl border border-dashed p-6 text-center">
          <p>No mods matched the current filters.</p>
        </div>
      )}

      {props.pagination &&
        paginationComponent(props.pagination, props.busy, props.onApply)}
    </div>
  );
}
