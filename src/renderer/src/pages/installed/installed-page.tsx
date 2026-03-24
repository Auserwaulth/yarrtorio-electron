import { useMemo, useState } from "react";
import { BentoTile } from "../../components/bento-tile";
import { ConfirmAction } from "../../components/confirm-action";
import { FadeSkeleton } from "../../components/fade-skeleton";
import type { AppSettings, InstalledMod } from "@shared/types/mod";
import { InstalledPageSkeleton } from "./installed-page-skeleton";
import { ModListPanel } from "./components/mod-list-panel";

interface InstalledPageProps {
  settings: AppSettings;
  items: InstalledMod[];
  busy: boolean;
  latestVersions: Record<string, string>;
  onDelete(modName: string, filePath: string): void;
  onUpdate(modName: string, filePath: string): void;
  onToggleEnabled(modName: string, enabled: boolean): void;
  onOpen(modName: string): void;
  onCheckUpdates(): void;
  onCreateModListProfile(name: string): void;
  onRenameModListProfile(profileId: string, name: string): void;
  onSwitchModListProfile(profileId: string): void;
  onRemoveModListProfile(profileId: string): void;
}

type StatusFilter = "all" | "enabled" | "disabled";

const statusFilters: Array<{
  key: StatusFilter;
  label: string;
}> = [
  { key: "all", label: "All" },
  { key: "enabled", label: "Enabled" },
  { key: "disabled", label: "Disabled" },
];

export function InstalledPage({
  settings,
  items,
  busy,
  latestVersions,
  onDelete,
  onUpdate,
  onToggleEnabled,
  onOpen,
  onCheckUpdates,
  onCreateModListProfile,
  onRenameModListProfile,
  onSwitchModListProfile,
  onRemoveModListProfile,
}: InstalledPageProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filteredItems = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return items.filter((item) => {
      const matchesQuery =
        !needle ||
        item.name.toLowerCase().includes(needle) ||
        item.fileName.toLowerCase().includes(needle);

      const isEnabled = item.enabled ?? true;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "enabled" && isEnabled) ||
        (statusFilter === "disabled" && !isEnabled);

      return matchesQuery && matchesStatus;
    });
  }, [items, query, statusFilter]);
  return (
    <BentoTile title="Installed archives">
      <div className="mb-4 flex flex-col gap-3">
        <ModListPanel
          settings={settings}
          busy={busy}
          onCreateModListProfile={onCreateModListProfile}
          onRenameModListProfile={onRenameModListProfile}
          onSwitchModListProfile={onSwitchModListProfile}
          onRemoveModListProfile={onRemoveModListProfile}
        />

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <label className="input input-bordered flex w-full items-center gap-2 md:max-w-md">
            <input
              type="text"
              className="grow"
              placeholder="Filter installed mods by name"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          <p className="text-base-content/70 text-sm">
            Showing {filteredItems.length} of {items.length} installed mod
            {items.length === 1 ? "" : "s"}
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
                onClick={() => setStatusFilter(filter.key)}
                disabled={busy}
                type="button"
              >
                {filter.label}
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
      </div>

      <FadeSkeleton
        loading={busy}
        skeleton={<InstalledPageSkeleton />}
        minHeight="20rem"
      >
        <>
          {items.length > 0 && filteredItems.length === 0 ? (
            <div className="bg-base-200 rounded-xl border border-dashed p-8 text-center text-sm">
              <p>No installed mods matched your filter.</p>
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-auto">
              <table className="table">
                <thead className="bg-base-100 sticky top-0 z-10">
                  <tr>
                    <th>Name</th>
                    <th>Installed</th>
                    <th>Latest</th>
                    <th>Enabled</th>
                    <th>Archive</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.filePath}>
                      <td>{item.name}</td>
                      <td>{item.version}</td>
                      <td>
                        {latestVersions[item.name] ? (
                          <span
                            className={
                              latestVersions[item.name] !== item.version
                                ? "text-warning"
                                : ""
                            }
                          >
                            {latestVersions[item.name]}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          className="toggle toggle-primary"
                          checked={item.enabled ?? true}
                          onChange={(event) =>
                            onToggleEnabled(item.name, event.target.checked)
                          }
                          disabled={busy}
                        />
                      </td>
                      <td className="max-w-56 truncate">{item.fileName}</td>
                      <td>
                        <div className="flex justify-end gap-2">
                          <button
                            className="btn btn-sm"
                            disabled={busy}
                            onClick={() => onOpen(item.name)}
                          >
                            Details
                          </button>
                          <button
                            className="btn btn-sm"
                            disabled={busy}
                            onClick={() => onUpdate(item.name, item.filePath)}
                          >
                            Update
                          </button>
                          <ConfirmAction
                            triggerLabel="Delete"
                            triggerClassName="btn btn-sm btn-error btn-outline"
                            confirmLabel="Delete archive"
                            title={`Delete ${item.name}?`}
                            description={
                              <div className="space-y-2">
                                <p>
                                  This removes the ZIP archive from your
                                  configured mods folder.
                                </p>
                                <p className="text-base-content/70 text-xs">
                                  File: {item.fileName}
                                </p>
                              </div>
                            }
                            disabled={busy}
                            onConfirm={() => onDelete(item.name, item.filePath)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      </FadeSkeleton>

      {!busy && (
        <div>
          {items.length === 0 && (
            <div className="bg-base-200 rounded-xl border border-dashed p-8 text-center text-sm">
              <p>No ZIP mods found in the configured mods folder.</p>
            </div>
          )}

        </div>
      )}
    </BentoTile>
  );
}
