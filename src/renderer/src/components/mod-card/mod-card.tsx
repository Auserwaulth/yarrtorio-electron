import { useState } from "react";
import { formatDownloads } from "./mod-card.utils";
import type { ModCardProps } from "./mod-card.types";

export function ModCard({ mod, onOpen, onDownload }: ModCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(mod.thumbnail) && !imageFailed;
  const releaseVersion = mod.latestRelease?.version;

  return (
    <article className="card overflow-hidden border border-base-300 bg-base-100 shadow-lg">
      {showImage && (
        <figure className="h-44 bg-base-200">
          <img
            src={mod.thumbnail}
            alt={mod.title}
            loading="lazy"
            className="h-full w-full object-cover"
            onError={() => setImageFailed(true)}
          />
        </figure>
      )}

      <div className="card-body gap-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold">{mod.title}</h3>
            <p className="truncate text-sm text-base-content/70">{mod.name}</p>
          </div>
          <div className="badge badge-outline shrink-0">
            {mod.category ?? "mod"}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {mod.libraryState?.isInstalled && (
            <span className="badge badge-success badge-soft">Downloaded</span>
          )}
          {mod.libraryState?.isInModList && (
            <span
              className={`badge ${mod.libraryState.isEnabledInModList ? "badge-primary badge-soft" : "badge-warning badge-soft"}`}
            >
              {mod.libraryState.isEnabledInModList
                ? "In mod-list"
                : "In mod-list (disabled)"}
            </span>
          )}
        </div>

        <p className="line-clamp-3 text-sm text-base-content/75">
          {mod.summary || "No summary available."}
        </p>

        <hr />
        <div className="flex flex-wrap gap-2 text-xs text-base-content/60">
          <span>By {mod.owner}</span>
          <span>·</span>
          <span>{formatDownloads(mod.downloadsCount)} downloads</span>
          <span>·</span>
          <span>{releaseVersion ?? "No release"}</span>
        </div>

        <div className="card-actions justify-end">
          <button
            className="btn btn-primary btn-sm"
            onClick={() => onOpen(mod.name)}
          >
            Details
          </button>
          {/* <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              if (releaseVersion) onDownload(mod.name, releaseVersion);
            }}
            disabled={!releaseVersion || mod.libraryState?.isInstalled}
          >
            {mod.libraryState?.isInstalled ? "Downloaded" : "Download"}
          </button> */}
        </div>
      </div>
    </article>
  );
}
