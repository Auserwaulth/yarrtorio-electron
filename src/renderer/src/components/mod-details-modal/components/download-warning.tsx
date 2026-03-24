import { ModReleaseSummary } from "@shared/types/mod";
import {
  getInstallableDependencies,
  getSkippedDependencies,
  describeDependency,
} from "../utils";

/**
 * Props for the DownloadWarning component
 */
interface DownloadWarningProps {
  /** The release being downloaded */
  pendingDownload: ModReleaseSummary;
  /** Callback to confirm download with dependencies */
  onConfirm(): void;
  /** Callback to skip dependencies and download only the mod */
  onSkipDependencies(): void;
  /** Callback to cancel the download */
  onCancel(): void;
}

/**
 * A warning component that informs users about required dependencies
 * before they download a mod. Provides options to download with dependencies,
 * download only the mod, or cancel.
 *
 * @param props - Component props
 * @param props.pendingDownload - The release being downloaded
 * @param props.onConfirm - Confirm download with dependencies
 * @param props.onSkipDependencies - Download mod only
 * @param props.onCancel - Cancel the download
 *
 * @example
 * <DownloadWarning
 *   pendingDownload={release}
 *   onConfirm={() => downloadWithDeps()}
 *   onSkipDependencies={() => downloadOnly()}
 *   onCancel={() => cancel()}
 * />
 */
export function DownloadWarning({
  pendingDownload,
  onConfirm,
  onSkipDependencies,
  onCancel,
}: DownloadWarningProps) {
  const installableDependencies = getInstallableDependencies(pendingDownload);
  const skippedDependencies = getSkippedDependencies(pendingDownload);

  return (
    <div className="border-warning/30 bg-warning/10 rounded-2xl border p-4 text-sm">
      <div className="space-y-2">
        <h4 className="text-warning-content font-bold">
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
