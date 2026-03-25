import { appRoutes } from "../../app/app-routes";
import { AppIcon } from "../app-icon";
import type { SidebarNavProps } from "./sidebar-nav.types";

/**
 * A sidebar navigation component that provides navigation between
 * the main application pages: Dashboard, Browse, Installed, and Settings.
 *
 * @param props - Component props
 * @param props.active - The currently active page
 * @param props.onSelect - Callback when a page is selected
 *
 * @example
 * <SidebarNav
 *   active="browse"
 *   onSelect={(page) => navigateTo(page)}
 * />
 */
export function SidebarNav({ active, collapsed, onSelect }: SidebarNavProps) {
  return (
    <aside
      className={`card sticky top-4 z-20 h-fit overflow-hidden transition-[width] duration-300 ease-out ${
        collapsed ? "w-full lg:w-21" : "w-full lg:w-70"
      }`}
    >
      <div className="card-body border-base-300/35 bg-base-100/45 border p-2 shadow-lg backdrop-blur-md">
        <nav aria-label="Primary" className="grid gap-2">
          {appRoutes.map(({ key, label, icon }) => {
            const isActive = active === key;

            return (
              <button
                key={key}
                className={`group flex h-14 w-full items-center transition-colors duration-200 ${
                  isActive
                    ? "bg-base-100 text-base-content shadow-sm"
                    : "text-base-content/70 hover:bg-base-100/70 hover:text-base-content"
                }`}
                onClick={() => onSelect(key)}
                title={collapsed ? label : undefined}
                type="button"
              >
                <span className="flex w-15 shrink-0 items-center justify-center">
                  <span
                    className={`flex h-10 w-10 items-center justify-center transition-colors duration-200 ${
                      isActive ? "text-primary" : null
                    }`}
                  >
                    <AppIcon className="h-4.5 w-4.5" name={icon} />
                  </span>
                </span>

                <span
                  aria-hidden={collapsed}
                  className={`min-w-0 overflow-hidden text-left text-sm font-medium whitespace-nowrap transition-[max-width,opacity,padding] duration-200 ease-out ${
                    collapsed
                      ? "max-w-0 px-0 opacity-0"
                      : "max-w-40 pr-4 opacity-100"
                  }`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
