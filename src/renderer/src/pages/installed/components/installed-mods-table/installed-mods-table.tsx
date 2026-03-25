import { ConfirmAction } from "../../../../components/confirm-action";
import type { InstalledModsTableProps } from "./installed-mods-table.types";

export function InstalledModsTable({
  items,
  filteredItems,
  busy,
  latestVersions,
  installedConflicts,
  onDelete,
  onUpdate,
  onOpen,
  onToggleEnabled,
  onShowConflicts,
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
              <td>
                <div className="flex flex-wrap items-center gap-2">
                  <span>{item.name}</span>
                  {(installedConflicts[item.name]?.length ?? 0) > 0 ? (
                    <button
                      className="badge badge-error badge-soft cursor-pointer gap-1 transition hover:scale-[1.02] hover:badge-outline focus:outline-none focus:ring-2 focus:ring-error/40"
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
                          This removes the ZIP archive from your configured mods
                          folder.
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
  );
}
