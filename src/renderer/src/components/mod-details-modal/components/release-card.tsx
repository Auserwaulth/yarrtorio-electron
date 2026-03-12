import type { ModReleaseSummary } from "@shared/types/mod";
import {
  formatReleaseDate,
  getDependenciesByKind,
  getInstallableDependencies,
} from "../utils";

interface ReleaseCardProps {
  release: ModReleaseSummary;
  isSelected: boolean;
  isLatest: boolean;
  onSelect(releaseVersion: string): void;
  onDownload(release: ModReleaseSummary): void;
}

export function ReleaseCard({
  release,
  isSelected,
  isLatest,
  onSelect,
  onDownload,
}: ReleaseCardProps) {
  const requiredCount = getDependenciesByKind(release, "required").length;
  const installableCount = getInstallableDependencies(release).length;

  return (
    <div
      className={`rounded-2xl border p-4 transition ${
        isSelected
          ? "border-primary bg-primary/8"
          : "border-base-content/10 bg-base-200/70"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-lg font-bold">{release.version}</h4>
            {isLatest ? (
              <span className="badge badge-primary">Latest</span>
            ) : null}
            {isSelected ? (
              <span className="badge badge-outline">Selected</span>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
            <span className="badge badge-outline">
              Released {formatReleaseDate(release.releasedAt)}
            </span>
            {release.factorioVersion ? (
              <span className="badge badge-outline">
                Factorio {release.factorioVersion}
              </span>
            ) : null}
            <span className="badge badge-outline">
              {requiredCount} required deps
            </span>
            <span className="badge badge-outline">
              {installableCount} auto-downloadable
            </span>
          </div>

          <p className="text-base-content/60 text-sm break-all">
            {release.fileName}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={`btn btn-sm ${isSelected ? "btn-outline" : "btn-ghost"}`}
            onClick={() => onSelect(release.version)}
          >
            {isSelected ? "Selected" : "Select"}
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => onDownload(release)}
          >
            Download
          </button>
        </div>
      </div>
    </div>
  );
}
