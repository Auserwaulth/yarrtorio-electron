import { AppIcon } from "../../../../components/app-icon";
import { ConfirmAction } from "../../../../components/confirm-action";
import type { InstalledPageToolbarProps } from "./installed-page-toolbar.types";

const statusFilters: Array<{
  key: InstalledPageToolbarProps["statusFilter"];
  label: string;
}> = [
  { key: "all", label: "All" },
  { key: "enabled", label: "Enabled" },
  { key: "disabled", label: "Disabled" },
  { key: "needs-update", label: "Needs Update" },
  { key: "conflicted", label: "Conflicted" },
];

export function InstalledPageToolbar({
  busy,
  query,
  filteredCount,
  totalCount,
  statusFilter,
  needsUpdateCount,
  conflictedCount,
  selectedCount,
  selectedOutdatedCount,
  onQueryChange,
  onStatusFilterChange,
  onUpdateAllOutdated,
  onCheckUpdates,
  onUpdateSelected,
  onDeleteSelected,
}: InstalledPageToolbarProps) {
  const updateAllDisabled = busy || totalCount === 0;
  const updateSelectedDisabled = busy || selectedOutdatedCount === 0;
  const deleteSelectedDisabled = busy || selectedCount === 0;

  return (
    <>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <label className="input input-bordered flex w-full items-center gap-2 md:max-w-md">
          <input
            type="text"
            className="grow"
            placeholder="Filter installed mods by name"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </label>

        <p className="text-base-content/70 text-sm">
          Showing {filteredCount} of {totalCount} installed mod
          {totalCount === 1 ? "" : "s"}
          {selectedCount > 0 ? ` • ${selectedCount} selected` : ""}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          {statusFilters.map((filter) => (
            <button
              key={filter.key}
              className={`btn btn-sm ${
                statusFilter === filter.key ? "btn-primary" : "btn-ghost"
              }`}
              onClick={() => onStatusFilterChange(filter.key)}
              disabled={busy}
              type="button"
            >
              {filter.label}
              {filter.key === "needs-update" ? ` (${needsUpdateCount})` : ""}
              {filter.key === "conflicted" ? ` (${conflictedCount})` : ""}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="btn btn-sm btn-outline"
            onClick={onCheckUpdates}
            disabled={busy}
            type="button"
          >
            <AppIcon name="RefreshCw" className="size-4" />
            {busy ? "Checking..." : ""}
          </button>
          <button
            className="btn btn-sm btn-primary"
            disabled={updateAllDisabled}
            onClick={onUpdateAllOutdated}
            type="button"
            title={
              busy
                ? "Wait for the current operation to finish"
                : totalCount === 0
                  ? "No installed mods are available"
                  : "Queue updates for all outdated installed mods"
            }
          >
            {busy
              ? "Working..."
              : needsUpdateCount > 0
                ? `Update all outdated (${needsUpdateCount})`
                : "Update all outdated"}
          </button>
          <span className="text-base-content/30 text-sm">|</span>
          <button
            className="btn btn-sm btn-ghost"
            onClick={onUpdateSelected}
            disabled={updateSelectedDisabled}
            type="button"
            aria-label={
              selectedOutdatedCount > 0
                ? `Update ${selectedOutdatedCount} selected outdated mods`
                : "Update selected mods"
            }
            title={
              selectedOutdatedCount > 0
                ? `Queue updates for ${selectedOutdatedCount} selected outdated mods`
                : "Select outdated mods to update them together"
            }
          >
            <AppIcon name="Download" className="size-4" />
            <span>
              {selectedOutdatedCount > 0 ? `(${selectedOutdatedCount})` : ""}
            </span>
          </button>
          <ConfirmAction
            triggerLabel={
              <>
                <AppIcon name="Trash2" className="size-4" />
                <span>{selectedCount > 0 ? `(${selectedCount})` : "(0)"}</span>
              </>
            }
            triggerClassName="btn btn-sm btn-ghost text-error"
            confirmLabel="Delete selected archives"
            title={`Delete ${selectedCount} selected mod${selectedCount === 1 ? "" : "s"}?`}
            description={
              <p>
                This removes the selected ZIP archives from your configured mods
                folder.
              </p>
            }
            disabled={deleteSelectedDisabled}
            onConfirm={onDeleteSelected}
          />
        </div>
      </div>
    </>
  );
}
