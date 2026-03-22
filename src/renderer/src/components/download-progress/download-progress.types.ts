import type { DownloadProgress as DownloadProgressItem } from "@shared/types/mod";

export interface DownloadProgressProps {
  items: DownloadProgressItem[];
  onRetry?: (download: DownloadProgressItem) => void;
}
