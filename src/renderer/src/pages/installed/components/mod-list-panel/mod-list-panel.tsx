import { ConfirmAction } from "../../../../components/confirm-action";
import { PromptAction } from "../../../../components/prompt-action";
import type { ModListPanelProps } from "./mod-list-panel.types";

export function ModListPanel({
  settings,
  busy,
  conflictCount,
  onCreateModListProfile,
  onRenameModListProfile,
  onSwitchModListProfile,
  onRemoveModListProfile,
}: ModListPanelProps) {
  const activeProfile =
    settings.modListProfiles.find(
      (profile) => profile.id === settings.activeModListProfileId,
    ) ?? settings.modListProfiles[0];
  const profileCount = settings.modListProfiles.length;

  return (
    <div className="from-base-200/90 via-base-100 to-base-200/70 border-base-300 grid gap-4 rounded-2xl border bg-linear-to-br p-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)]">
      <div className="grid gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge badge-outline">
                {profileCount} profile{profileCount === 1 ? "" : "s"}
              </span>
              {conflictCount > 0 ? (
                <span className="badge badge-error badge-soft">
                  {conflictCount} conflict{conflictCount === 1 ? "" : "s"}
                </span>
              ) : null}
            </div>

            <div>
              <p className="text-2xl font-semibold tracking-tight">
                {activeProfile?.name ?? "Default"}
              </p>
              <p className="text-base-content/65 max-w-xl text-sm leading-6">
                The selected profile is the one currently written to the real
                `mod-list.json` inside the mods folder. Other saved profiles
                stay parked in app data until you switch to them.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="py-3">
            <p className="text-base-content/60 text-xs tracking-wide uppercase">
              Switching
            </p>
            <p className="mt-1 text-sm">
              Swap which saved mod-list controls enabled states and syncs.
            </p>
          </div>
          <div className=" py-3">
            <p className="text-base-content/60 text-xs tracking-wide uppercase">
              Saving
            </p>
            <p className="mt-1 text-sm">
              Snapshot the current active file as a new reusable profile.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 rounded-2xl p-4">
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Switch profile</legend>
          <select
            className="select select-bordered w-full"
            value={settings.activeModListProfileId}
            onChange={(event) => onSwitchModListProfile(event.target.value)}
            disabled={busy}
          >
            {settings.modListProfiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name}
              </option>
            ))}
          </select>
        </fieldset>

        <div className="grid gap-2 sm:grid-cols-2">
          <PromptAction
            triggerLabel="Save Current As"
            triggerClassName="btn btn-primary w-full"
            title="Save current mod-list as a new profile"
            label="Profile name"
            placeholder="Space Age run"
            confirmLabel="Create profile"
            description="This copies the currently active mod-list into a new saved profile."
            disabled={busy}
            onConfirm={(name) => onCreateModListProfile(name)}
          />
          {activeProfile ? (
            <PromptAction
              triggerLabel="Rename profile"
              triggerClassName="btn btn-outline w-full"
              title={`Rename ${activeProfile.name}`}
              label="Profile name"
              initialValue={activeProfile.name}
              placeholder="My mod pack"
              confirmLabel="Save name"
              description="Choose a clearer name for this saved mod-list profile."
              disabled={busy}
              onConfirm={(nextName) =>
                onRenameModListProfile(activeProfile.id, nextName)
              }
            />
          ) : (
            <button className="btn btn-outline w-full" disabled type="button">
              Rename profile
            </button>
          )}
        </div>

        {activeProfile ? (
          <ConfirmAction
            triggerLabel="Remove profile"
            triggerClassName="btn btn-error btn-outline w-full"
            confirmLabel="Remove profile"
            title={`Remove ${activeProfile.name}?`}
            description={
              <p>
                This removes the saved profile from app data. The app will
                switch to another profile first if this one is active.
              </p>
            }
            disabled={busy || settings.modListProfiles.length <= 1}
            onConfirm={() => onRemoveModListProfile(activeProfile.id)}
          />
        ) : null}
      </div>
    </div>
  );
}
