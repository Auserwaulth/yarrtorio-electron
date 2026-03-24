import type { PropsWithChildren, ReactNode } from "react";

/**
 * Props for the BentoTile component
 */
export interface BentoTileProps extends PropsWithChildren {
  /** The title displayed at the top of the tile */
  title: string;
  /** Optional action button to display next to the title */
  action?: ReactNode;
  /** Additional CSS classes to apply to the tile */
  className?: string;
}
