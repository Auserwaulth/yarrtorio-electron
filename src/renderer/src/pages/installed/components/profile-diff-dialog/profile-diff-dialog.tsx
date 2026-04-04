import { PageModal } from "../../../../components/page-modal";
import type { ProfileDiffDialogProps } from "./profile-diff-dialog.types";

export function ProfileDiffDialog({
  comparison,
  onClose,
}: ProfileDiffDialogProps) {
  if (!comparison) {
    return null;
  }

  return (
    <PageModal
      onClose={onClose}
      panelClassName="max-h-[85vh] max-w-3xl overflow-y-auto"
      backdropLabel="Close profile diff dialog"
    >
      <div className="border-base-300 flex items-start justify-between gap-4 border-b px-6 py-5">
        <div>
          <h3 className="text-lg font-semibold">
            Compare {comparison.leftProfile.name} vs{" "}
            {comparison.rightProfile.name}
          </h3>
          <p className="text-base-content/70 mt-1 text-sm">
            {comparison.sameCount} identical, {comparison.changed.length}{" "}
            changed, {comparison.added.length} added,{" "}
            {comparison.removed.length} removed.
          </p>
        </div>
        <button
          className="btn btn-ghost btn-sm btn-circle"
          type="button"
          aria-label="Close profile diff dialog"
          onClick={onClose}
        >
          x
        </button>
      </div>

      <div className="grid gap-4 px-6 py-5">
        <section className="grid gap-2">
          <h4 className="text-sm font-semibold tracking-wide uppercase opacity-70">
            Changed
          </h4>
          {comparison.changed.length === 0 ? (
            <p className="text-base-content/70 text-sm">No changed entries.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-sm table">
                <thead>
                  <tr>
                    <th>Mod</th>
                    <th>{comparison.leftProfile.name}</th>
                    <th>{comparison.rightProfile.name}</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.changed.map((entry) => (
                    <tr key={entry.name}>
                      <td>{entry.name}</td>
                      <td>
                        {entry.left.enabled ? "Enabled" : "Disabled"}
                        {entry.left.version ? ` - ${entry.left.version}` : ""}
                      </td>
                      <td>
                        {entry.right.enabled ? "Enabled" : "Disabled"}
                        {entry.right.version ? ` - ${entry.right.version}` : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          <section className="grid gap-2">
            <h4 className="text-sm font-semibold tracking-wide uppercase opacity-70">
              Only in {comparison.leftProfile.name}
            </h4>
            {comparison.removed.length === 0 ? (
              <p className="text-base-content/70 text-sm">
                Nothing unique here.
              </p>
            ) : (
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {comparison.removed.map((entry) => (
                  <li key={entry.name}>
                    {entry.name}
                    {entry.left?.version ? ` - ${entry.left.version}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="grid gap-2">
            <h4 className="text-sm font-semibold tracking-wide uppercase opacity-70">
              Only in {comparison.rightProfile.name}
            </h4>
            {comparison.added.length === 0 ? (
              <p className="text-base-content/70 text-sm">
                Nothing unique here.
              </p>
            ) : (
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {comparison.added.map((entry) => (
                  <li key={entry.name}>
                    {entry.name}
                    {entry.right?.version ? ` - ${entry.right.version}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </PageModal>
  );
}
