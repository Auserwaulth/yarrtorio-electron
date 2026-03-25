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
  onQueryChange,
  onStatusFilterChange,
  onCheckUpdates,
}: InstalledPageToolbarProps) {
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
        <div className="flex gap-2">
          <button
            className="btn btn-sm btn-outline"
            onClick={onCheckUpdates}
            disabled={busy}
            type="button"
          >
            {busy ? "Checking..." : "Check for updates"}
          </button>
        </div>
      </div>
    </>
  );
}
