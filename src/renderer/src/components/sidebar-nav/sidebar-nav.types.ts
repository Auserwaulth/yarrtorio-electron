export type PageKey = "dashboard" | "browse" | "installed" | "settings";

export interface SidebarNavProps {
  active: PageKey;
  onSelect(page: PageKey): void;
}
