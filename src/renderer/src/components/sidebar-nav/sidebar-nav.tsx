import { APP_NAME } from "@shared/constants";
import type { SidebarNavProps } from "./sidebar-nav.types";
import { SidebarInstructions } from "./sidebar-instructions";

const items = [
  ["dashboard", "Dashboard"],
  ["browse", "Browse"],
  ["installed", "Installed"],
  ["settings", "Settings"],
] as const;

export function SidebarNav({ active, onSelect }: SidebarNavProps) {
  return (
    <div className="h-full space-y-4">
      <div className="card bg-base-100 sticky top-4 z-20 space-y-4 shadow-xl">
        <div className="card-body">
          <div className="flex flex-col gap-2">
            <div className="text-base-content/60 text-xs tracking-[0.3em] uppercase">
              <p>Factorio Mod</p>
              <p>Downloader</p>
            </div>
            <h1 className="text-3xl font-black">{APP_NAME}</h1>
          </div>
          <ul className="menu rounded-box bg-base-200 w-full gap-2 p-2">
            {items.map(([key, label]) => (
              <li key={key}>
                <button
                  className={
                    active === key
                      ? "bg-primary text-primary-content hover:bg-primary/90"
                      : "hover:bg-base-300"
                  }
                  onClick={() => onSelect(key)}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <SidebarInstructions />
    </div>
  );
}
