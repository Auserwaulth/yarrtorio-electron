import type { DownloadProgressProps } from "./download-progress.types";

function formatStatus(state: string): string {
  return state.charAt(0).toUpperCase() + state.slice(1);
}

export function DownloadProgress({ items }: DownloadProgressProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-base-300 p-6 text-sm text-base-content/60">
        No downloads yet.
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map((item) => {
        const statusClass =
          item.state === "failed"
            ? "badge-error"
            : item.state === "completed"
              ? "badge-success"
              : item.state === "running"
                ? "badge-primary"
                : "badge-outline";

        const progressValue = item.state === "completed" ? 100 : item.percent;
        const progressLabel =
          item.state === "completed"
            ? "Ready in mods folder."
            : (item.message ??
              `${item.transferredBytes}/${item.totalBytes || 0} bytes`);

        return (
          <div key={item.key} className="rounded-2xl bg-base-200 p-4">
            <div className="mb-2 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate font-semibold">{item.modName}</p>
                <p className="truncate text-xs text-base-content/60">
                  Version {item.version}
                </p>
              </div>
              <div className={`badge ${statusClass}`}>
                {formatStatus(item.state)}
              </div>
            </div>
            <progress
              className="progress progress-primary w-full"
              value={progressValue}
              max={100}
            />
            <div className="mt-2 flex justify-between gap-3 text-xs text-base-content/60">
              <span>{progressValue}%</span>
              <span className="truncate text-right">{progressLabel}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
