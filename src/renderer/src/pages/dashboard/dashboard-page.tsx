import { useState } from "react";
import { AppMeta } from "@shared/types/app-meta";
import { BentoTile } from "../../components/bento-tile";
import { DownloadProgress } from "../../components/download-progress";
import type {
  DownloadProgress as DownloadItem,
  InstalledMod,
} from "@shared/types/mod";
import { Credits } from "./components/credits";

interface DashboardPageProps {
  installed: InstalledMod[];
  downloads: DownloadItem[];
  onOpenBrowse(): void;
  openInstalled(): void;
  onSyncFromModList(): void;
  onRetryDownload?: (download: DownloadItem) => void;
  onRetryAllFailed?: (downloads: DownloadItem[]) => void;
  appMeta?: AppMeta | null;
}

export function DashboardPage({
  installed,
  downloads,
  onOpenBrowse,
  openInstalled,
  onSyncFromModList,
  onRetryDownload,
  onRetryAllFailed,
  appMeta,
}: DashboardPageProps) {
  const [activeTab, setActiveTab] = useState<"recent" | "failed">("recent");

  const activeDownloads = downloads.filter(
    (item) => item.state === "queued" || item.state === "running",
  );

  const recentDownloads = [...downloads]
    .sort((a, b) => {
      const statePriority = {
        running: 5,
        queued: 4,
        completed: 3,
        failed: 2,
        cancelled: 1,
      };

      const aPriority = statePriority[a.state];
      const bPriority = statePriority[b.state];

      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }

      if (a.state === "running" || a.state === "queued") {
        return a.createdAt - b.createdAt;
      }

      const aTime = a.completedAt ?? a.updatedAt;
      const bTime = b.completedAt ?? b.updatedAt;
      return bTime - aTime;
    })
    .slice(0, 6);

  const failedDownloads = downloads.filter((item) => item.state === "failed");

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <BentoTile title="Library overview" className="xl:col-span-3">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="bg-base-200 rounded-2xl p-4">
            <p className="text-base-content/60 text-sm">Installed archives</p>
            <p className="mt-1 text-3xl font-black">{installed.length}</p>
          </div>
          <div className="bg-base-200 rounded-2xl p-4">
            <p className="text-base-content/60 text-sm">In progress now</p>
            <p className="mt-1 text-3xl font-black">{activeDownloads.length}</p>
          </div>
        </div>
      </BentoTile>

      <BentoTile title="Quick actions" className="xl:col-span-1">
        <div className="grid gap-3">
          <button className="btn btn-primary" onClick={onOpenBrowse}>
            Browse mods
          </button>
          <button className="btn btn-secondary" onClick={openInstalled}>
            Manage installed
          </button>
          <button className="btn btn-outline" onClick={onSyncFromModList}>
            Sync from mod-list
          </button>
        </div>
      </BentoTile>

      <BentoTile
        title={activeTab === "recent" ? "Recent downloads" : "Failed downloads"}
        className="xl:col-span-2"
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="tabs tabs-boxed">
            <button
              className={`tab ${activeTab === "recent" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("recent")}
            >
              Recent
            </button>
            <button
              className={`tab ${activeTab === "failed" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("failed")}
            >
              Failed
              {failedDownloads.length > 0 && (
                <span className="badge badge-error ml-2">
                  {failedDownloads.length}
                </span>
              )}
            </button>
          </div>
          {activeTab === "failed" && failedDownloads.length > 0 && (
            <button
              className="btn btn-error btn-sm"
              onClick={() => onRetryAllFailed?.(failedDownloads)}
            >
              Retry All ({failedDownloads.length})
            </button>
          )}
        </div>

        {activeTab === "recent" ? (
          <DownloadProgress items={recentDownloads} />
        ) : (
          <DownloadProgress
            items={failedDownloads}
            onRetry={onRetryDownload || (() => {})}
          />
        )}
      </BentoTile>

      <Credits appMeta={appMeta} />
    </div>
  );
}
