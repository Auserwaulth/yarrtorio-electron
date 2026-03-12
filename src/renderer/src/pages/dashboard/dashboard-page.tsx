import { AppMeta } from "@shared/types/app-meta";
import { BentoTile } from "../../components/bento-tile";
import { DownloadProgress } from "../../components/download-progress";
import type {
  DownloadProgress as DownloadItem,
  InstalledMod,
} from "@shared/types/mod";
import { Credits } from "./credits";

interface DashboardPageProps {
  installed: InstalledMod[];
  downloads: DownloadItem[];
  onOpenBrowse(): void;
  openInstalled(): void;
  onSyncFromModList(): void;
  appMeta?: AppMeta | null;
}

export function DashboardPage({
  installed,
  downloads,
  onOpenBrowse,
  openInstalled,
  onSyncFromModList,
  appMeta,
}: DashboardPageProps) {
  const activeDownloads = downloads.filter(
    (item) => item.state === "queued" || item.state === "running",
  );

  const recentDownloads = [...downloads]
    .sort((a, b) => {
      const aTime = a.completedAt ?? a.updatedAt;
      const bTime = b.completedAt ?? b.updatedAt;
      return bTime - aTime;
    })
    .slice(0, 6);

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <BentoTile title="Library overview" className="xl:col-span-3">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl bg-base-200 p-4">
            <p className="text-sm text-base-content/60">Installed archives</p>
            <p className="mt-1 text-3xl font-black">{installed.length}</p>
          </div>
          <div className="rounded-2xl bg-base-200 p-4">
            <p className="text-sm text-base-content/60">In progress now</p>
            <p className="mt-1 text-3xl font-black">{activeDownloads.length}</p>
          </div>
        </div>
      </BentoTile>

      <BentoTile title="Quick actions" className="xl:col-span-1">
        <div className="grid gap-3 ">
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

      <BentoTile title="Recent downloads" className="xl:col-span-2">
        <DownloadProgress items={recentDownloads} />
      </BentoTile>

      <Credits appMeta={appMeta} />
    </div>
  );
}
