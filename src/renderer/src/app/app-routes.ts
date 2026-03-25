import type { AppIconName } from "../components/app-icon";

export const appRoutes = [
  { key: "dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { key: "browse", label: "Browse", icon: "Search" },
  { key: "installed", label: "Installed", icon: "Download" },
  { key: "user-manual", label: "User Manual", icon: "BookOpenText" },
  { key: "settings", label: "Settings", icon: "Settings2" },
] as const;

export type PageKey = (typeof appRoutes)[number]["key"];
export type AppRoute = {
  key: PageKey;
  label: string;
  icon: AppIconName;
};
