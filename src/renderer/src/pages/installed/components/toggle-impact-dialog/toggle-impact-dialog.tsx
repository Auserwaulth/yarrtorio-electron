import { PageModal } from "../../../../components/page-modal";
import type { ToggleImpactDialogProps } from "./toggle-impact-dialog.types";

export function ToggleImpactDialog({
  impact,
  onClose,
  onConfirm,
}: ToggleImpactDialogProps) {
  if (!impact) {
    return null;
  }

  return (
    <PageModal
      onClose={onClose}
      panelClassName="max-w-lg"
      backdropLabel="Close toggle impact dialog"
    >
        <div className="border-base-300 bg-base-200/70 border-b px-6 py-5">
          <h3 className="text-lg font-semibold">
            {impact.enabled
              ? `Enable ${impact.modName}?`
              : `Disable ${impact.modName}?`}
          </h3>
        </div>

        <div className="space-y-4 px-6 py-5 text-sm">
          {impact.enabled ? (
            <>
              <p>
                Enabling <strong>{impact.modName}</strong> should also enable
                these installed required dependencies:
              </p>
              <div className="flex flex-wrap gap-2">
                {impact.relatedRequiredDependencies.map((name) => (
                  <span key={name} className="badge badge-primary badge-soft">
                    {name}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <>
              <p>
                Disabling <strong>{impact.modName}</strong> may affect these
                enabled mods that depend on it:
              </p>
              <div className="flex flex-wrap gap-2">
                {impact.dependentMods.map((name) => (
                  <span key={name} className="badge badge-warning badge-soft">
                    {name}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="border-base-300 bg-base-100/90 flex justify-end gap-3 border-t px-6 py-4">
          <button className="btn btn-ghost" type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            className={`btn ${impact.enabled ? "btn-primary" : "btn-warning"}`}
            type="button"
            onClick={() =>
              onConfirm(
                impact.modName,
                impact.enabled,
                impact.enabled ? impact.relatedRequiredDependencies : undefined,
              )
            }
          >
            {impact.enabled ? "Enable required mods too" : "Disable anyway"}
          </button>
        </div>
    </PageModal>
  );
}
