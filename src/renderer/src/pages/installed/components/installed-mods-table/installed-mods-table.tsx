import { ConfirmAction } from "../../../../components/confirm-action";
import type { InstalledModsTableProps } from "./installed-mods-table.types";

export function InstalledModsTable({
  items,
  filteredItems,
  busy,
  pendingModNames,
  latestVersions,
  installedConflicts,
  onDelete,
  onUpdate,
  onOpen,
  onToggleEnabled,
  onShowConflicts,
  selectedFilePaths,
  onToggleSelectedFilePath,
  allFilteredSelected,
  onToggleSelectAllFiltered,
}: InstalledModsTableProps) {
  if (items.length === 0) {
    return (
      <div className="bg-base-200 rounded-xl border border-dashed p-8 text-center text-sm">
        <p>No ZIP mods found in the configured mods folder.</p>
      </div>
    );
  }

  if (filteredItems.length === 0) {
    return (
      <div className="bg-base-200 rounded-xl border border-dashed p-8 text-center text-sm">
        <p>No installed mods matched your filter.</p>
      </div>
    );
  }

  return (
    <div className="max-h-[60vh] overflow-auto">
      <table className="table">
        <thead className="bg-base-100 sticky top-0 z-10">
          <tr>
            <th className="w-12">
              <input
                type="checkbox"
                className="checkbox checkbox-sm"
                checked={allFilteredSelected}
                aria-label="Select all visible installed mods"
                onChange={() => onToggleSelectAllFiltered()}
              />
            </th>
            <th>Name</th>
            <th>Installed</th>
            <th>Latest</th>
            <th>Enabled</th>
            <th>Archive</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredItems.map((item) => {
            const rowPending = pendingModNames.includes(item.name);
            const rowBusy = busy || rowPending;
            const selected = selectedFilePaths.includes(item.filePath);

            return (
              <tr key={item.filePath}>
                <td>
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={selected}
                    aria-label={`Select ${item.name}`}
                    disabled={rowBusy}
                    onChange={() => onToggleSelectedFilePath(item.filePath)}
                  />
                </td>
                <td>
                  <div className="flex flex-wrap items-center gap-2">
                    <span>{item.name}</span>
                    {rowPending ? (
                      <span className="badge badge-outline">Working</span>
                    ) : null}
                    {(installedConflicts[item.name]?.length ?? 0) > 0 ? (
                      <button
                        className="badge badge-error badge-soft hover:badge-outline focus:ring-error/40 cursor-pointer gap-1 transition hover:scale-[1.02] focus:ring-2 focus:outline-none"
                        type="button"
                        aria-label={`View conflicts for ${item.name}`}
                        onClick={() => onShowConflicts(item.name)}
                      >
                        <span>Conflict</span>
                      </button>
                    ) : null}
                  </div>
                </td>
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
                    disabled={rowBusy}
                  />
                </td>
                <td className="max-w-56 truncate">{item.fileName}</td>
                <td>
                  <div className="flex justify-end gap-2">
                    <button
                      className="btn btn-sm"
                      disabled={rowBusy}
                      onClick={() => onOpen(item.name)}
                    >
                      Details
                    </button>
                    <button
                      className="btn btn-sm"
                      disabled={rowBusy}
                      onClick={() => onUpdate(item.name, item.fileName)}
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
                            This removes the ZIP archive from your configured
                            mods folder.
                          </p>
                          <p className="text-base-content/70 text-xs">
                            File: {item.fileName}
                          </p>
                        </div>
                      }
                      disabled={rowBusy}
                      onConfirm={() => onDelete(item.name, item.fileName)}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
