import type { PageKey } from "../../app/app-routes";

/**
 * Props for the SidebarNav component
 */
export interface SidebarNavProps {
  /** The currently active page */
  active: PageKey;
  /** Whether the sidebar is currently collapsed */
  collapsed: boolean;
  /** Callback when a page is selected */
  onSelect(page: PageKey): void;
}
