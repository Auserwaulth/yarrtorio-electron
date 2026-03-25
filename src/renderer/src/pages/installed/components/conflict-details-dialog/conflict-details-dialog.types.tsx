import type { InstalledConflict } from "@shared/types/mod";

export interface ConflictDetailsDialogProps {
  modName: string | null;
  conflicts: InstalledConflict[];
  onClose(): void;
  onOpenMod(modName: string): void;
}
