import { useEffect, useMemo, useState } from "react";
import type {
  SyncFromModListPreview,
  SyncPreviewItem,
} from "@shared/types/mod";
import { PageModal } from "../page-modal";

interface SyncPreviewModalProps {
  open: boolean;
  preview: SyncFromModListPreview | null;
  loading?: boolean;
  running?: boolean;
  onClose(): void;
  onConfirm(): void;
}

type SyncPreviewTab =
  | "downloads"
  | "updates"
  | "skips"
  | "removals"
  | "problems";

function PreviewSkeleton() {
  return (
    <>
      <div className="flex flex-wrap gap-2 text-sm">
        <div className="skeleton h-7 w-28 rounded-full" />
        <div className="skeleton h-7 w-24 rounded-full" />
        <div className="skeleton h-7 w-22 rounded-full" />
        <div className="skeleton h-7 w-20 rounded-full" />
        <div className="skeleton h-7 w-32 rounded-full" />
        <div className="skeleton h-7 w-24 rounded-full" />
      </div>

      <div className="tabs tabs-box bg-base-200 p-1">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="skeleton h-10 flex-1 rounded-lg"
          />
        ))}
      </div>

      <div className="max-h-[52vh] overflow-y-auto pr-1">
        <section className="grid gap-2">
          <div className="skeleton h-4 w-36" />
          <div className="grid gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="border-base-300 bg-base-100 rounded-xl border px-4 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="grid gap-2">
                    <div className="skeleton h-5 w-40" />
                    <div className="skeleton h-4 w-72 max-w-full" />
                  </div>
                  <div className="grid justify-items-end gap-2">
                    <div className="skeleton h-4 w-24" />
                    <div className="skeleton h-4 w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

function PreviewSection({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: SyncPreviewItem[];
  emptyLabel: string;
}) {
  return (
    <section className="grid gap-2">
      <h4 className="text-sm font-semibold tracking-wide uppercase opacity-70">
        {title}
      </h4>
      {items.length === 0 ? (
        <p className="text-base-content/70 text-sm">{emptyLabel}</p>
      ) : (
        <div className="grid gap-2">
          {items.map((item) => (
            <div
              key={`${item.action}:${item.name}:${item.targetVersion ?? item.installedVersion ?? "none"}`}
              className="border-base-300 bg-base-100 rounded-xl border px-4 py-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-base-content/70 mt-1 text-sm">
                    {item.reason}
                  </p>
                </div>
                <div className="text-base-content/70 text-right text-sm">
                  {item.installedVersion ? (
                    <p>Installed: {item.installedVersion}</p>
                  ) : null}
                  {item.targetVersion ? (
                    <p>Target: {item.targetVersion}</p>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function SyncPreviewModal({
  open,
  preview,
  loading = false,
  running = false,
  onClose,
  onConfirm,
}: SyncPreviewModalProps) {
  const [activeTab, setActiveTab] = useState<SyncPreviewTab>("downloads");

  const tabs = useMemo(
    () =>
      preview
        ? [
            {
              key: "downloads" as const,
              label: "Downloads",
              count: preview.downloadCount,
              items: preview.downloads,
              emptyLabel: "No new downloads would be queued.",
            },
            {
              key: "updates" as const,
              label: "Updates",
              count: preview.updateCount,
              items: preview.updates,
              emptyLabel: "No installed archives would be replaced.",
            },
            {
              key: "skips" as const,
              label: "Skips",
              count: preview.skipCount,
              items: preview.skips,
              emptyLabel: "Nothing is already satisfied.",
            },
            {
              key: "removals" as const,
              label: "Remove Candidates",
              count: preview.removeCount,
              items: preview.removals,
              emptyLabel: "No managed archives appear removable.",
            },
            {
              key: "problems" as const,
              label: "Problems",
              count: preview.problemCount,
              items: preview.problems,
              emptyLabel: "No blocking issues were detected.",
            },
          ]
        : [],
    [preview],
  );

  useEffect(() => {
    if (!preview) {
      return;
    }

    const firstTabWithItems =
      tabs.find((tab) => tab.count > 0)?.key ?? "downloads";
    setActiveTab(firstTabWithItems);
  }, [preview, tabs]);

  if (!open) {
    return null;
  }

  const currentTab =
    tabs.find((tab) => tab.key === activeTab) ?? tabs[0] ?? null;

  return (
    <PageModal
      onClose={running ? () => undefined : onClose}
      panelClassName="max-w-4xl"
      backdropLabel="Close sync preview dialog"
    >
      <div className="border-base-300 flex items-start justify-between gap-4 border-b px-6 py-5">
        <div>
          <h3 className="text-lg font-semibold">Sync from mod-list preview</h3>
          <p className="text-base-content/70 mt-1 text-sm">
            Missing archives will be queued for download, matching archives
            will be skipped, and remove candidates are preview-only for now.
          </p>
        </div>
      </div>

      <div className="grid gap-4 px-6 py-5">
        {loading || !preview ? (
          <PreviewSkeleton />
        ) : (
          <>
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="badge badge-primary badge-soft">
                {preview.queueableCount} queueable
              </span>
              <span className="badge badge-outline">
                {preview.downloadCount} download
                {preview.downloadCount === 1 ? "" : "s"}
              </span>
              <span className="badge badge-outline">
                {preview.updateCount} update{preview.updateCount === 1 ? "" : "s"}
              </span>
              <span className="badge badge-outline">
                {preview.skipCount} skip{preview.skipCount === 1 ? "" : "s"}
              </span>
              <span className="badge badge-warning badge-soft">
                {preview.removeCount} remove candidate
                {preview.removeCount === 1 ? "" : "s"}
              </span>
              <span className="badge badge-error badge-soft">
                {preview.problemCount} problem
                {preview.problemCount === 1 ? "" : "s"}
              </span>
            </div>

            <div className="tabs tabs-box bg-base-200 p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  className={`tab flex-1 ${activeTab === tab.key ? "tab-active" : ""}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                  <span className="ml-1 opacity-70">({tab.count})</span>
                </button>
              ))}
            </div>

            <div className="max-h-[52vh] overflow-y-auto pr-1">
              {currentTab ? (
                <PreviewSection
                  title={currentTab.label}
                  items={currentTab.items}
                  emptyLabel={currentTab.emptyLabel}
                />
              ) : null}
            </div>
          </>
        )}
      </div>

      <div className="border-base-300 bg-base-100/90 flex justify-end gap-3 border-t px-6 py-4">
        <button
          className="btn btn-ghost"
          type="button"
          disabled={running || loading}
          onClick={onClose}
        >
          Close
        </button>
        <button
          className="btn btn-primary"
          type="button"
          disabled={loading || running || !preview || preview.queueableCount === 0}
          onClick={onConfirm}
        >
          {loading
            ? "Preparing preview..."
            : running
            ? "Queueing..."
            : preview && preview.queueableCount > 0
              ? `Queue sync actions (${preview.queueableCount})`
              : "Nothing to queue"}
        </button>
      </div>
    </PageModal>
  );
}
