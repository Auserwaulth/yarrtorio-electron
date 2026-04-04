import type { AppSettings, ModListProfileComparison } from "@shared/types/mod";

export interface ModListPanelProps {
  settings: AppSettings;
  busy: boolean;
  conflictCount: number;
  onCreateModListProfile(name: string): void;
  onRenameModListProfile(profileId: string, name: string): void;
  onSwitchModListProfile(profileId: string): void;
  onRemoveModListProfile(profileId: string): void;
  onDiffModListProfiles(
    leftProfileId: string,
    rightProfileId: string,
  ): Promise<ModListProfileComparison | null>;
  onExportModListProfile(profileId: string): void;
  onImportModListProfile(): void;
}
