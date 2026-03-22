import { useEffect, useMemo, useState } from "react";
import type { ModReleaseSummary } from "@shared/types/mod";
import { InfoLink } from "./components/info-link";
import { GalleryImages } from "./components/gallery-Images";
import { DependenciesTab } from "./tabs/dependencies-tab";
import { OverviewTab } from "./tabs/overview-tab";
import { ReleasesTab } from "./tabs/releases-tab";
import type { ModalTab, ModDetailsModalProps } from "./types";
import { TAB_LABELS, getInstallableDependencies, getPortalUrl } from "./utils";

import { DownloadWarning } from "./components/download-warning";

function SkeletonContent() {
  return (
    <div className="space-y-6 px-6 py-7 sm:px-8 sm:py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-1.5">
          <div className="skeleton h-8 w-48"></div>
          <div className="skeleton h-4 w-32"></div>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="skeleton btn btn-outline btn-sm w-28"></div>
          <div className="skeleton btn btn-primary btn-sm w-32"></div>
          <div className="skeleton btn btn-outline btn-sm btn-error w-20"></div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <div className="skeleton badge badge-outline h-6 w-16"></div>
        <div className="skeleton badge badge-outline h-6 w-24"></div>
        <div className="skeleton badge badge-outline h-6 w-20"></div>
      </div>

      <div className="skeleton h-4 w-full"></div>
      <div className="skeleton h-4 w-3/4"></div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="skeleton h-12 w-full"></div>
        <div className="skeleton h-12 w-full"></div>
        <div className="skeleton h-12 w-full"></div>
        <div className="skeleton h-12 w-full"></div>
      </div>

      <div className="tabs tabs-boxed skeleton p-1">
        <div className="skeleton tab h-10 flex-1"></div>
        <div className="skeleton tab h-10 flex-1"></div>
        <div className="skeleton tab h-10 flex-1"></div>
      </div>

      <div className="space-y-3">
        <div className="skeleton h-6 w-24"></div>
        <div className="skeleton h-4 w-full"></div>
        <div className="skeleton h-4 w-full"></div>
        <div className="skeleton h-4 w-2/3"></div>
      </div>
    </div>
  );
}

export function ModDetailsModal({
  mod,
  loading = false,
  pendingName,
  onClose,
  onDownload,
}: ModDetailsModalProps) {
  const [descExpanded, setDescExpanded] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [pendingDownload, setPendingDownload] =
    useState<ModReleaseSummary | null>(null);
  const [activeTab, setActiveTab] = useState<ModalTab>("overview");
  const [selectedReleaseVersion, setSelectedReleaseVersion] = useState<
    string | null
  >(null);

  useEffect(() => {
    setDescExpanded(false);
    setActiveImageIndex(0);
    setPendingDownload(null);
    setActiveTab("overview");
    setSelectedReleaseVersion(
      mod?.latestRelease?.version ?? mod?.releases[0]?.version ?? null,
    );
  }, [mod]);

  const portalUrl = useMemo(() => (mod ? getPortalUrl(mod) : ""), [mod]);

  const galleryImages = useMemo(
    () =>
      Array.from(
        new Set([
          ...(mod?.images ?? []),
          ...(mod?.thumbnail ? [mod.thumbnail] : []),
        ]),
      ),
    [mod],
  );

  const latestVersion = mod?.latestRelease?.version ?? null;

  const latestRelease = useMemo(() => {
    if (!mod) return null;

    return (
      mod.releases.find((release) => release.version === latestVersion) ??
      mod.latestRelease ??
      mod.releases[0] ??
      null
    );
  }, [latestVersion, mod]);

  const selectedRelease = useMemo(() => {
    if (!mod) return null;

    if (selectedReleaseVersion) {
      const matchedRelease = mod.releases.find(
        (release) => release.version === selectedReleaseVersion,
      );
      if (matchedRelease) return matchedRelease;
    }

    return latestRelease ?? mod.releases[0] ?? null;
  }, [latestRelease, mod, selectedReleaseVersion]);

  if (!mod && !pendingName) return null;

  const activeImage = galleryImages[activeImageIndex] ?? mod?.thumbnail;
  const isLatestDownloaded =
    Boolean(mod?.libraryState?.isInstalled) && latestVersion !== null;

  async function handleOpenExternal(url: string) {
    try {
      await window.electronApi.external.openUrl(url);
    } catch (error) {
      console.error("Failed to open external URL:", error);
    }
  }

  function handleClose() {
    setDescExpanded(false);
    setActiveImageIndex(0);
    setPendingDownload(null);
    setActiveTab("overview");
    setSelectedReleaseVersion(
      mod?.latestRelease?.version ?? mod?.releases[0]?.version ?? null,
    );
    onClose();
  }

  function requestDownload(release: ModReleaseSummary) {
    if (getInstallableDependencies(release).length === 0) {
      onDownload({ version: release.version, includeDependencies: false });
      return;
    }

    setPendingDownload(release);
  }

  return (
    <dialog className="modal modal-open px-3 py-6 sm:px-6 sm:py-10">
      <div className="modal-box max-h-[92vh] max-w-5xl overflow-x-hidden p-0">
        {loading ? (
          <div className="skeleton h-64 w-full"></div>
        ) : activeImage ? (
          <figure className="bg-base-200 max-h-100 overflow-hidden">
            <img
              src={activeImage}
              alt={mod?.title}
              className="h-full w-full object-cover"
            />
          </figure>
        ) : null}

        {loading ? (
          <SkeletonContent />
        ) : (
          <div className="space-y-6 px-6 py-7 sm:px-8 sm:py-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 space-y-1.5">
                <h3 className="text-2xl leading-tight font-black">
                  {mod?.title}
                </h3>
                <p className="text-base-content/70 text-sm">
                  {mod?.name} · by {mod?.owner}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  className="btn btn-outline btn-sm"
                  type="button"
                  onClick={() => void handleOpenExternal(portalUrl)}
                >
                  View on Portal
                </button>

                {latestRelease ? (
                  <button
                    className="btn btn-primary btn-sm"
                    type="button"
                    disabled={isLatestDownloaded}
                    onClick={() => requestDownload(latestRelease)}
                  >
                    {isLatestDownloaded
                      ? "Downloaded latest"
                      : "Download latest"}
                  </button>
                ) : null}

                <button
                  className="btn btn-outline btn-sm btn-error"
                  type="button"
                  onClick={handleClose}
                >
                  Close
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-sm">
              <span className="badge badge-outline">
                {mod?.category ?? "mod"}
              </span>

              {mod?.downloadsCount !== undefined ? (
                <span className="badge badge-outline">
                  {mod.downloadsCount.toLocaleString()} downloads
                </span>
              ) : null}

              {latestVersion ? (
                <span className="badge badge-primary badge-outline">
                  Latest {latestVersion}
                </span>
              ) : null}

              {mod?.libraryState?.isInstalled ? (
                <span className="badge badge-success badge-soft">
                  Downloaded
                </span>
              ) : null}

              {mod?.libraryState?.isInModList ? (
                <span
                  className={`badge ${
                    mod.libraryState.isEnabledInModList
                      ? "badge-primary badge-soft"
                      : "badge-warning badge-soft"
                  }`}
                >
                  {mod.libraryState.isEnabledInModList
                    ? "In mod-list"
                    : "In mod-list (disabled)"}
                </span>
              ) : null}

              {mod?.tags.map((tag) => (
                <span key={tag} className="badge badge-outline">
                  {tag}
                </span>
              ))}
            </div>

            {pendingDownload ? (
              <DownloadWarning
                pendingDownload={pendingDownload}
                onConfirm={() => {
                  onDownload({
                    version: pendingDownload.version,
                    includeDependencies: true,
                  });
                  setPendingDownload(null);
                }}
                onSkipDependencies={() => {
                  onDownload({
                    version: pendingDownload.version,
                    includeDependencies: false,
                  });
                  setPendingDownload(null);
                }}
                onCancel={() => setPendingDownload(null)}
              />
            ) : null}

            {galleryImages.length > 1 ? (
              <GalleryImages
                activeImageIndex={activeImageIndex}
                setActiveImageIndex={setActiveImageIndex}
                galleryImages={galleryImages}
                modTitle={mod?.title ?? ""}
              />
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <InfoLink
                label="Source"
                onOpen={handleOpenExternal}
                url={mod?.sourceUrl}
              />
              <InfoLink
                label="Homepage"
                onOpen={handleOpenExternal}
                url={mod?.homepageUrl}
              />
              <InfoLink
                label="License"
                onOpen={handleOpenExternal}
                url={mod?.licenseUrl}
                value={mod?.licenseName}
              />
              <InfoLink
                label="Selected release"
                onOpen={handleOpenExternal}
                value={
                  selectedRelease?.version ?? latestVersion ?? "No release"
                }
              />
            </div>

            <div className="tabs tabs-box bg-base-200 p-1">
              {(Object.entries(TAB_LABELS) as Array<[ModalTab, string]>).map(
                ([tab, label]) => (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    className={`tab flex-1 ${activeTab === tab ? "tab-active" : ""}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {label}
                  </button>
                ),
              )}
            </div>

            {activeTab === "overview" && mod ? (
              <OverviewTab
                summary={mod.summary}
                description={mod.description}
                descExpanded={descExpanded}
                onOpenExternal={handleOpenExternal}
                onToggleExpanded={() => setDescExpanded((current) => !current)}
              />
            ) : null}

            {activeTab === "dependencies" ? (
              <DependenciesTab
                release={selectedRelease}
                onDownload={requestDownload}
              />
            ) : null}

            {activeTab === "releases" && mod ? (
              <ReleasesTab
                releases={mod.releases}
                latestRelease={latestRelease}
                latestVersion={latestVersion}
                isLatestDownloaded={isLatestDownloaded}
                selectedReleaseVersion={selectedRelease?.version ?? null}
                onDownload={requestDownload}
                onSelectRelease={(releaseVersion) => {
                  setSelectedReleaseVersion(releaseVersion);
                  setActiveTab("dependencies");
                }}
              />
            ) : null}
          </div>
        )}
      </div>

      <form method="dialog" className="modal-backdrop">
        <button type="button" onClick={handleClose}>
          close
        </button>
      </form>
    </dialog>
  );
}
