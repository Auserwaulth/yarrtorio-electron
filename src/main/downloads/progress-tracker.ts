import type { DownloadProgress } from "@shared/types/mod";

export class ProgressTracker {
  private items = new Map<string, DownloadProgress>();

  upsert(input: DownloadProgress): DownloadProgress {
    this.items.set(input.key, input);
    return input;
  }

  patch(
    key: string,
    patch: Partial<DownloadProgress>,
  ): DownloadProgress | undefined {
    const current = this.items.get(key);

    if (!current) {
      return undefined;
    }

    const next = { ...current, ...patch };
    this.items.set(key, next);
    return next;
  }

  list(): DownloadProgress[] {
    return [...this.items.values()].sort((a, b) => b.updatedAt - a.updatedAt);
  }
}
