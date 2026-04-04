import type { ModListProfileComparison } from "@shared/types/mod";

export interface ProfileDiffDialogProps {
  comparison: ModListProfileComparison | null;
  onClose(): void;
}
