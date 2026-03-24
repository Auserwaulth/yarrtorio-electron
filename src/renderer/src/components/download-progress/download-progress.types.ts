import type { DownloadProgress as DownloadProgressItem } from "@shared/types/mod";

/**
 * Props for the DownloadProgress component
 */
export interface DownloadProgressProps {
  /** Array of download items to display */
  items: DownloadProgressItem[];
  /** Callback when retry is clicked for a failed download */
  onRetry?: (download: DownloadProgressItem) => void;
}
