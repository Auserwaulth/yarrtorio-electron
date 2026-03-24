/** Page keys for navigation */
export type PageKey = "dashboard" | "browse" | "installed" | "settings";

/**
 * Props for the SidebarNav component
 */
export interface SidebarNavProps {
  /** The currently active page */
  active: PageKey;
  /** Callback when a page is selected */
  onSelect(page: PageKey): void;
}
