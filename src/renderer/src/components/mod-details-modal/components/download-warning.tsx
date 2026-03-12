import { ModReleaseSummary } from "@shared/types/mod";
import { getInstallableDependencies, getSkippedDependencies, describeDependency } from "../utils";

export function DownloadWarning({
  pendingDownload,
  onConfirm,
  onSkipDependencies,
  onCancel,
}: {
  pendingDownload: ModReleaseSummary;
  onConfirm(): void;
  onSkipDependencies(): void;
  onCancel(): void;
}) {
  const installableDependencies = getInstallableDependencies(pendingDownload);
  const skippedDependencies = getSkippedDependencies(pendingDownload);

  return (
    <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm">
      <div className="space-y-2">
        <h4 className="font-bold text-warning-content">
          {pendingDownload.version} has required dependencies
        </h4>
        <p className="text-base-content/80">
          Downloading this release with dependencies will also queue required
          mods. That can change your load order or setup and may break a save or
          game configuration.
        </p>
        <p className="text-base-content/70">
          Auto-downloadable:{" "}
          {installableDependencies.map(describeDependency).join(", ") || "none"}
        </p>
        {skippedDependencies.length > 0 ? (
          <p className="text-base-content/60">
            Skipped:{" "}
            {skippedDependencies
              .map(
                (dependency) =>
                  `${describeDependency(dependency)}${dependency.reasonSkipped ? ` (${dependency.reasonSkipped})` : ""}`,
              )
              .join(", ")}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2 pt-2">
          <button
            className="btn btn-warning btn-sm"
            type="button"
            onClick={onConfirm}
          >
            Download with dependencies
          </button>
          <button
            className="btn btn-outline btn-sm"
            type="button"
            onClick={onSkipDependencies}
          >
            Download mod only
          </button>
          <button
            className="btn btn-ghost btn-sm"
            type="button"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}