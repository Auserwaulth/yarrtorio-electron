import { EventEmitter } from "node:events";
import { ProgressTracker } from "./progress-tracker";
import { runDownloadJob } from "./download-worker";
import type { DownloadProgress, DownloadRequest } from "@shared/types/mod";

type QueueEventMap = {
  progress: (progress: DownloadProgress) => void;
};

type PendingItem = {
  key: string;
  request: DownloadRequest;
};

/**
 * Manages background mod downloads with bounded concurrency and progress event
 * emission.
 *
 * The queue deduplicates requests that are already queued or running for the
 * same mod/version pair, tracks progress history through `ProgressTracker`, and
 * emits a `progress` event whenever a download changes state.
 */
export class DownloadQueue extends EventEmitter {
  private readonly tracker = new ProgressTracker();
  private readonly pending: PendingItem[] = [];
  private readonly inFlight = new Set<string>();
  private concurrency = 3;

  /**
   * Updates the maximum number of concurrent downloads and immediately tries to
   * start additional work if slots become available.
   *
   * @param value - Maximum concurrent download jobs to run.
   */
  setConcurrency(value: number): void {
    this.concurrency = value;
    this.pump();
  }

  /**
   * Queues a download request unless an equivalent mod/version download is
   * already queued or running.
   *
   * @param request - Download job description.
   * @returns The existing active progress item when deduplicated, otherwise the
   * newly created queued progress record.
   */
  enqueue(request: DownloadRequest): DownloadProgress {
    const existing = this.tracker
      .list()
      .find(
        (item) =>
          item.modName === request.modName &&
          item.version === request.version &&
          ["queued", "running"].includes(item.state),
      );

    if (existing) {
      return existing;
    }

    const now = Date.now();
    const key = `${request.modName}@${request.version}@${now}@${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    const progress = this.tracker.upsert({
      key,
      modName: request.modName,
      version: request.version,
      transferredBytes: 0,
      totalBytes: 0,
      percent: 0,
      state: "queued",
      message: "Waiting to start...",
      createdAt: now,
      updatedAt: now,
    });

    this.pending.push({ key, request });
    this.emitProgress(progress);
    this.pump();

    return progress;
  }

  /**
   * Returns all known download progress items sorted by newest update first.
   */
  list(): DownloadProgress[] {
    return this.tracker.list();
  }

  private emitProgress(progress: DownloadProgress): void {
    this.emit("progress", progress);
  }

  /**
   * Starts pending downloads while there is available concurrency.
   *
   * Each job transitions through queued -> running -> completed/failed and
   * emits progress updates for renderer subscribers.
   */
  private pump(): void {
    while (this.inFlight.size < this.concurrency && this.pending.length > 0) {
      const item = this.pending.shift();
      if (!item) return;

      const { key, request } = item;

      if (this.inFlight.has(key)) {
        continue;
      }

      this.inFlight.add(key);

      const running = this.tracker.patch(key, {
        state: "running",
        message: "Downloading...",
        updatedAt: Date.now(),
      });

      if (running) {
        this.emitProgress(running);
      }

      void runDownloadJob(request, (patch) => {
        const next = this.tracker.patch(key, {
          ...patch,
          state: "running",
          updatedAt: Date.now(),
        });

        if (next) {
          this.emitProgress(next);
        }
      })
        .then(() => {
          const now = Date.now();

          const next = this.tracker.patch(key, {
            state: "completed",
            percent: 100,
            message: "Completed",
            updatedAt: now,
            completedAt: now,
          });

          if (next) {
            this.emitProgress(next);
          }
        })
        .catch((error: unknown) => {
          const next = this.tracker.patch(key, {
            state: "failed",
            message:
              error instanceof Error ? error.message : "Download failed.",
            updatedAt: Date.now(),
          });

          if (next) {
            this.emitProgress(next);
          }
        })
        .finally(() => {
          this.inFlight.delete(key);
          this.pump();
        });
    }
  }

  override on<U extends keyof QueueEventMap>(
    event: U,
    listener: QueueEventMap[U],
  ): this {
    return super.on(event, listener);
  }
}
