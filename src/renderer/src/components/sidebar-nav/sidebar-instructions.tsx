import { APP_NAME } from "@shared/constants";

export function SidebarInstructions() {
  return (
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
            It will redownload everything that is missing, and remove mods that
            are not listed.
          </p>
        </div>
      </div>
    </div>
  );
}
