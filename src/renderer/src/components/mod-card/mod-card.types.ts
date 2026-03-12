import type { ModSummary } from "@shared/types/mod";

export interface ModCardProps {
  mod: ModSummary;
  onOpen(modName: string): void;
  onDownload(modName: string, version?: string): void;
}
