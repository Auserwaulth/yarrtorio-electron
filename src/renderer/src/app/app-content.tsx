import { BrowsePage } from "../pages/browse/browse-page";
import { DashboardPage } from "../pages/dashboard/dashboard-page";
import { InstalledPage } from "../pages/installed/installed-page";
import { SettingsPage } from "../pages/settings/settings-page";
import { UserManualPage } from "../pages/user-manual/user-manual-page";
import type { PageKey } from "./app-routes";

interface AppContentProps {
  page: PageKey;
  dashboard: React.ComponentProps<typeof DashboardPage>;
  browse: React.ComponentProps<typeof BrowsePage>;
  installed: React.ComponentProps<typeof InstalledPage>;
  settings: React.ComponentProps<typeof SettingsPage>;
}

const pageComponents = {
  dashboard: DashboardPage,
  browse: BrowsePage,
  installed: InstalledPage,
  "user-manual": UserManualPage,
  settings: SettingsPage,
} as const;

export function AppContent(props: AppContentProps) {
  const { page, dashboard, browse, installed, settings } = props;

  switch (page) {
    case "dashboard": {
      const Component = pageComponents.dashboard;
      return <Component {...dashboard} />;
    }
    case "browse": {
      const Component = pageComponents.browse;
      return <Component {...browse} />;
    }
    case "installed": {
      const Component = pageComponents.installed;
      return <Component {...installed} />;
    }
    case "user-manual": {
      const Component = pageComponents["user-manual"];
      return <Component />;
    }
    case "settings": {
      const Component = pageComponents.settings;
      return <Component {...settings} />;
    }
  }
}
