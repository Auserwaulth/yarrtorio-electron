import type { InstalledConflict, InstalledMod } from "@shared/types/mod";

export interface InstalledModsTableProps {
  items: InstalledMod[];
  filteredItems: InstalledMod[];
  busy: boolean;
  pendingModNames: string[];
  latestVersions: Record<string, string>;
  installedConflicts: Record<string, InstalledConflict[]>;
  onDelete(modName: string, filePath: string): void;
  onUpdate(modName: string, filePath: string): void;
  onOpen(modName: string): void;
  onToggleEnabled(modName: string, enabled: boolean): void;
  onShowConflicts(modName: string): void;
}
