import type { PropsWithChildren, ReactNode } from "react";

export interface BentoTileProps extends PropsWithChildren {
  title: string;
  action?: ReactNode;
  className?: string;
}
