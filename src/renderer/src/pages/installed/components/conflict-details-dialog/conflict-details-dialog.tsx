import type { ConflictDetailsDialogProps } from "./conflict-details-dialog.types";

export function ConflictDetailsDialog({
  modName,
  conflicts,
  onClose,
  onOpenMod,
}: ConflictDetailsDialogProps) {
  if (!modName) {
    return null;
  }

  return (
    <dialog className="modal modal-open px-3">
      <div className="modal-box border-base-300 bg-base-100 max-w-xl border p-0 shadow-2xl">
        <div className="border-base-300 bg-base-200/70 border-b px-6 py-5">
          <h3 className="text-lg font-semibold">Conflicts for {modName}</h3>
        </div>

        <div className="space-y-3 px-6 py-5">
          {conflicts.map((conflict) => (
            <div
              key={`${conflict.modName}:${conflict.conflictsWith}`}
              className="border-base-300 bg-base-100 rounded-xl border p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{conflict.conflictsWith}</p>
                  <p className="text-base-content/70 mt-1 text-sm">
                    Declared rule: {conflict.reason}
                  </p>
                </div>
                <button
                  className="btn btn-sm"
                  type="button"
                  onClick={() => onOpenMod(conflict.conflictsWith)}
                >
                  Open mod
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="border-base-300 bg-base-100/90 flex justify-end border-t px-6 py-4">
          <button className="btn" type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      <button
        className="modal-backdrop"
        type="button"
        aria-label="Close conflicts dialog"
        onClick={onClose}
      />
    </dialog>
  );
}
