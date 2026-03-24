import type { AppSettings } from "@shared/types/mod";

export interface ModListPanelProps {
  settings: AppSettings;
  busy: boolean;
  onCreateModListProfile(name: string): void;
  onRenameModListProfile(profileId: string, name: string): void;
  onSwitchModListProfile(profileId: string): void;
  onRemoveModListProfile(profileId: string): void;
}
