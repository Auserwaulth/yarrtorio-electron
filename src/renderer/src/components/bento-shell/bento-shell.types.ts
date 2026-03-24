import type { PropsWithChildren, ReactNode } from "react";

/**
 * Props for the BentoShell component
 */
export interface BentoShellProps extends PropsWithChildren {
  /** The sidebar content to display on the left side of the layout */
  sidebar: ReactNode;
}
