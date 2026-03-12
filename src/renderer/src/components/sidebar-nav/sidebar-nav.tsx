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
    <div className="space-y-4 h-full">
      <div className="card sticky top-4 z-20 space-y-4 bg-base-100 shadow-xl">
        <div className="card-body ">
          <div className="flex flex-col gap-2">
            <div className="text-xs uppercase tracking-[0.3em] text-base-content/60">
              <p>Factorio Mod</p>
              <p>Downloader</p>
            </div>
            <h1 className="text-3xl font-black">{APP_NAME}</h1>
          </div>
          <ul className="menu gap-2 rounded-box bg-base-200 p-2 w-full">
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

      <div className="card border border-dashed bg-base-100 shadow-xl">
        <div className="card-body gap-3 text-xs text-base-content/70">
          <h2 className="text-lg font-bold text-base-content">
            How to use Yarrtorio
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
