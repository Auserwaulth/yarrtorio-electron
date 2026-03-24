import { ReleaseCard } from "../components/release-card";
import type { ReleasesTabProps } from "../types";

/**
 * A tab component that displays all available releases for a mod.
 * Each release is shown as a card with version info, release date,
 * and download/selection options.
 *
 * @param props - Component props
 * @param props.isLatestDownloaded - Whether the latest version is downloaded
 * @param props.latestRelease - The latest release
 * @param props.latestVersion - The latest version string
 * @param props.releases - Array of all releases
 * @param props.selectedReleaseVersion - Currently selected version
 * @param props.onDownload - Callback to download a release
 * @param props.onSelectRelease - Callback to select a release
 *
 * @example
 * <ReleasesTab
 *   isLatestDownloaded={false}
 *   latestRelease={latest}
 *   latestVersion="1.0.0"
 *   releases={allReleases}
 *   selectedReleaseVersion={selected}
 *   onDownload={(r) => download(r)}
 *   onSelectRelease={(v) => select(v)}
 * />
 */
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
