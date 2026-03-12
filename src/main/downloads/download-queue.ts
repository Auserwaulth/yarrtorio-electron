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

export class DownloadQueue extends EventEmitter {
  private readonly tracker = new ProgressTracker();
  private readonly pending: PendingItem[] = [];
  private readonly inFlight = new Set<string>();
  private concurrency = 3;

  setConcurrency(value: number): void {
    this.concurrency = value;
    this.pump();
  }

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

  list(): DownloadProgress[] {
    return this.tracker.list();
  }

  private emitProgress(progress: DownloadProgress): void {
    this.emit("progress", progress);
  }

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
