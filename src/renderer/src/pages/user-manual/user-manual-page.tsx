import { APP_NAME } from "@shared/constants";
import { BentoTile } from "../../components/bento-tile";

const setupSteps = [
  "Open Settings and choose your Factorio mods folder.",
  "Make sure the folder contains the game's mods and mod-list.json files.",
  "Save your settings so Yarrtorio can use that folder for downloads, sync, and profile switching.",
] as const;

const browseSteps = [
  "Go to Browse to search the Factorio mod portal by name, version, category, or tag.",
  "Open any mod card to inspect releases, descriptions, screenshots, and dependencies before downloading.",
  "Pick the version you want, then queue the download directly from the browser or the mod details modal.",
] as const;

const installedSteps = [
  "Use Installed to review every archive currently inside your mods folder.",
  "Update old versions, delete archives you no longer need, or toggle mods on and off without manually editing mod-list.json.",
  "Manage mod-list profiles from this page to switch between different setups more quickly.",
] as const;

const syncNotes = [
  "Sync from mod-list reads the active mod-list.json and makes your installed files match it.",
  "Missing mods listed in mod-list.json will be downloaded again.",
  "Mods that are not listed in the active mod-list.json can be removed during sync.",
  "If you use profiles, confirm the correct profile is active before syncing.",
] as const;

function StepList({ steps }: { steps: readonly string[] }) {
  return (
    <ol className="space-y-3 text-sm leading-6">
      {steps.map((step, index) => (
        <li
          key={step}
          className="border-base-300 bg-base-200/60 rounded-2xl border px-4 py-3"
        >
          <span className="text-primary mr-3 font-bold">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="text-base-content/80">{step}</span>
        </li>
      ))}
    </ol>
  );
}

export function UserManualPage() {
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <BentoTile title={`User Manual for ${APP_NAME}`} className="xl:col-span-3">
        <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-3">
            <p className="text-base-content/80 max-w-3xl text-sm leading-6">
              {APP_NAME} helps you browse, download, sync, and manage Factorio
              mods from one place. The steps below cover the usual workflow from
              first-time setup to keeping an existing mod folder in sync.
            </p>
            <div className="alert alert-info">
              <span className="text-sm leading-6">
                Use <span className="font-semibold">Settings</span> first. Most
                issues come from pointing the app at the wrong mods folder.
              </span>
            </div>
          </div>

          <div className="border-base-300 bg-base-200/70 rounded-3xl border p-5">
            <p className="text-base-content/60 text-xs tracking-[0.3em] uppercase">
              Recommended flow
            </p>
            <p className="mt-3 text-2xl font-black">
              Settings, Browse, Installed, Sync
            </p>
            <p className="text-base-content/70 mt-3 text-sm leading-6">
              Set the folder, find what you need, manage what is installed, then
              sync when you want the folder to follow the active mod-list.
            </p>
          </div>
        </div>
      </BentoTile>

      <BentoTile title="1. Set Up The Mods Folder" className="xl:col-span-1">
        <StepList steps={setupSteps} />
      </BentoTile>

      <BentoTile title="2. Browse And Download Mods" className="xl:col-span-1">
        <StepList steps={browseSteps} />
      </BentoTile>

      <BentoTile title="3. Manage Installed Mods" className="xl:col-span-1">
        <StepList steps={installedSteps} />
      </BentoTile>

      <BentoTile title="What Sync From mod-list Does" className="xl:col-span-2">
        <ul className="space-y-3 text-sm leading-6">
          {syncNotes.map((note) => (
            <li
              key={note}
              className="border-base-300 bg-base-200/60 rounded-2xl border px-4 py-3"
            >
              {note}
            </li>
          ))}
        </ul>
      </BentoTile>

      <BentoTile title="Good To Know" className="xl:col-span-1">
        <div className="space-y-3 text-sm leading-6">
          <div className="border-base-300 bg-base-200/60 rounded-2xl border px-4 py-3">
            Downloads are handled locally using the folder you selected in
            Settings.
          </div>
          <div className="border-base-300 bg-base-200/60 rounded-2xl border px-4 py-3">
            The Installed page is the safest place to toggle mods because it
            keeps the active mod-list.json aligned with your changes.
          </div>
          <div className="border-base-300 bg-base-200/60 rounded-2xl border px-4 py-3">
            If something looks wrong, check the log path in Settings before
            reporting the issue.
          </div>
        </div>
      </BentoTile>
    </div>
  );
}
