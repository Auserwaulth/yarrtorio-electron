import { ReleaseCard } from "../components/release-card";
import type { ReleasesTabProps } from "../types";

export function ReleasesTab({
  isLatestDownloaded,
  latestRelease,
  latestVersion,
  releases,
  selectedReleaseVersion,
  onDownload,
  onSelectRelease,
}: ReleasesTabProps) {
  return (
    <div className="space-y-4">
      <div className="bg-base-200 rounded-2xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-lg font-bold">Releases</h4>
            <p className="text-base-content/60 text-sm">
              Pick a release to inspect its dependencies or download it
              directly.
            </p>
          </div>

          {latestRelease ? (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={isLatestDownloaded}
              onClick={() => onDownload(latestRelease)}
            >
              {isLatestDownloaded ? "Downloaded latest" : "Download latest"}
            </button>
          ) : null}
        </div>
      </div>

      <div className="space-y-3">
        {releases.length > 0 ? (
          releases.map((release) => (
            <ReleaseCard
              key={release.version}
              release={release}
              isSelected={selectedReleaseVersion === release.version}
              isLatest={release.version === latestVersion}
              onSelect={onSelectRelease}
              onDownload={onDownload}
            />
          ))
        ) : (
          <div className="border-base-content/15 text-base-content/55 rounded-2xl border border-dashed px-4 py-8 text-center text-sm">
            No releases available.
          </div>
        )}
      </div>
    </div>
  );
}
