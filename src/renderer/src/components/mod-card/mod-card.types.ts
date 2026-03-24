import type { ModSummary } from "@shared/types/mod";

/**
 * Props for the ModCard component
 */
export interface ModCardProps {
  /** The mod summary data to display */
  mod: ModSummary;
  /** Callback when the mod details button is clicked */
  onOpen(modName: string): void;
  /** Callback when the download button is clicked */
  onDownload(modName: string, version?: string): void;
}
