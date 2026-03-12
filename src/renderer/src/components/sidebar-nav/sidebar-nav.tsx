import { APP_NAME } from "@shared/constants";
import type { SidebarNavProps } from "./sidebar-nav.types";

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

      <div className="card bg-base-100 border border-dashed shadow-xl">
        <div className="card-body text-base-content/70 gap-3 text-xs">
          <h2 className="text-base-content text-lg font-bold">
            How to use {APP_NAME}
          </h2>
          <p>
            1. Pick your Factorio mods folder and confirm the mod-list path in
            <span className="font-bold"> Settings</span>.
          </p>
          <p>
            2. Browse the API to find new mods, then open a card to inspect
            versions.
          </p>
          <p>
            3. Go to <span className="font-bold">Installed</span> to update,
            delete, or toggle mods while keeping mod-list.json in sync.
          </p>

          <div>
            <p>
              <span className="font-bold">Syncing</span> will read the
              mod-list.json file and update the installed mods to match it.
            </p>
            <p>
              It will redownload everything that is missing, and remove mods
              that are not listed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
