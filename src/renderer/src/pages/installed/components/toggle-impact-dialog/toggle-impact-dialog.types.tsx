import type { ModToggleImpact } from "@shared/types/mod";

export interface ToggleImpactDialogProps {
  impact: ModToggleImpact | null;
  onClose(): void;
  onConfirm(
    modName: string,
    enabled: boolean,
    relatedModNames?: string[],
  ): void;
}
