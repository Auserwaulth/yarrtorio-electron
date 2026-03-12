import { useEffect, useRef } from "react";
import type { DownloadProgress, DownloadState } from "@shared/types/mod";

interface UseDownloadToastListenerOptions {
  downloads: DownloadProgress[];
  onToast(tone: "info" | "success" | "error", message: string): void;
  onCompletedDownload(): void;
}

export function useDownloadToastListener({
  downloads,
  onToast,
  onCompletedDownload,
}: UseDownloadToastListenerOptions) {
  const seenDownloadStates = useRef(new Map<string, DownloadState>());

  useEffect(() => {
    for (const progress of downloads) {
      const previousState = seenDownloadStates.current.get(progress.key);
      if (previousState === progress.state) continue;

      seenDownloadStates.current.set(progress.key, progress.state);

      if (progress.state === "completed") {
        onCompletedDownload();
      }

      const toast = createToast(progress, previousState);
      if (!toast) continue;

      onToast(toast.tone, toast.text);
    }
  }, [downloads, onCompletedDownload, onToast]);
}

function createToast(
  progress: DownloadProgress,
  previousState?: DownloadState,
) {
  if (!previousState && progress.state === "queued") {
    return {
      tone: "info" as const,
      text: `Queued ${progress.modName} ${progress.version}`,
    };
  }

  if (progress.state === "completed") {
    return {
      tone: "success" as const,
      text: `Downloaded ${progress.modName} ${progress.version}`,
    };
  }

  if (progress.state === "failed") {
    return {
      tone: "error" as const,
      text: progress.message
        ? `${progress.modName} failed: ${progress.message}`
        : `Failed to download ${progress.modName}`,
    };
  }

  if (progress.state === "cancelled") {
    return {
      tone: "info" as const,
      text: `Cancelled ${progress.modName}`,
    };
  }

  return null;
}
