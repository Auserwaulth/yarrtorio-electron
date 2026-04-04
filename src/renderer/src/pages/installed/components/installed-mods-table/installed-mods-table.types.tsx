import type { InstalledConflict, InstalledMod } from "@shared/types/mod";

export interface InstalledModsTableProps {
  items: InstalledMod[];
  filteredItems: InstalledMod[];
  busy: boolean;
  pendingModNames: string[];
  latestVersions: Record<string, string>;
  installedConflicts: Record<string, InstalledConflict[]>;
  onDelete(modName: string, fileName: string): void;
  onUpdate(modName: string, fileName: string): void;
  onOpen(modName: string): void;
  onToggleEnabled(modName: string, enabled: boolean): void;
  onShowConflicts(modName: string): void;
  selectedFilePaths: string[];
  onToggleSelectedFilePath(filePath: string): void;
  allFilteredSelected: boolean;
  onToggleSelectAllFiltered(): void;
}
