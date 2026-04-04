import { useEffect, useState } from "react";
import { AppIcon } from "../../../../components/app-icon";
import { ConfirmAction } from "../../../../components/confirm-action";
import { PromptAction } from "../../../../components/prompt-action";
import { ProfileDiffDialog } from "../profile-diff-dialog";
import type { ModListPanelProps } from "./mod-list-panel.types";

export function ModListPanel({
  settings,
  busy,
  conflictCount,
  onCreateModListProfile,
  onRenameModListProfile,
  onSwitchModListProfile,
  onRemoveModListProfile,
  onDiffModListProfiles,
  onExportModListProfile,
  onImportModListProfile,
}: ModListPanelProps) {
  const [leftProfileId, setLeftProfileId] = useState(
    settings.activeModListProfileId,
  );
  const [rightProfileId, setRightProfileId] = useState(
    settings.modListProfiles.find(
      (profile) => profile.id !== settings.activeModListProfileId,
    )?.id ?? "",
  );
  const [comparisonBusy, setComparisonBusy] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [comparison, setComparison] = useState<Awaited<
    ReturnType<ModListPanelProps["onDiffModListProfiles"]>
  >>(null);

  const activeProfile =
    settings.modListProfiles.find(
      (profile) => profile.id === settings.activeModListProfileId,
    ) ?? settings.modListProfiles[0];
  const profileCount = settings.modListProfiles.length;
  const profileOptions = settings.modListProfiles;
  const leftProfile = profileOptions.find((profile) => profile.id === leftProfileId);
  const rightProfile = profileOptions.find(
    (profile) => profile.id === rightProfileId,
  );

  useEffect(() => {
    if (!profileOptions.some((profile) => profile.id === leftProfileId)) {
      setLeftProfileId(settings.activeModListProfileId);
      return;
    }

    if (
      !profileOptions.some((profile) => profile.id === rightProfileId) ||
      rightProfileId === leftProfileId
    ) {
      setRightProfileId(
        profileOptions.find((profile) => profile.id !== leftProfileId)?.id ?? "",
      );
    }
  }, [
    leftProfileId,
    profileOptions,
    rightProfileId,
    settings.activeModListProfileId,
  ]);

  async function handleCompareProfiles(): Promise<void> {
    if (!leftProfileId || !rightProfileId || leftProfileId === rightProfileId) {
      return;
    }

    setComparisonBusy(true);
    try {
      setComparison(await onDiffModListProfiles(leftProfileId, rightProfileId));
    } finally {
      setComparisonBusy(false);
    }
  }

  return (
    <div className="border-base-300 bg-base-100 rounded-2xl border p-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="badge badge-outline">
              {profileCount} profile{profileCount === 1 ? "" : "s"}
            </span>
            {conflictCount > 0 ? (
              <span className="badge badge-error badge-soft">
                {conflictCount} conflict{conflictCount === 1 ? "" : "s"}
              </span>
            ) : null}
          </div>

          <div className="space-y-1">
            <p className="text-lg font-semibold tracking-tight">
              {activeProfile?.name ?? "Default"}
            </p>
            <p className="text-base-content/65 max-w-2xl text-sm leading-6">
              This profile is currently synced to the real `mod-list.json`.
            </p>
          </div>
        </div>

        <div className="grid min-w-0 gap-2 xl:w-[32rem]">
          <div className="flex flex-col gap-2 lg:flex-row">
            <select
              className="select select-bordered min-w-0 flex-1"
              value={settings.activeModListProfileId}
              onChange={(event) => onSwitchModListProfile(event.target.value)}
              disabled={busy}
              aria-label="Switch active profile"
            >
              {settings.modListProfiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <PromptAction
                triggerLabel="Save As"
                triggerClassName="btn btn-primary"
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
                  triggerLabel="Rename"
                  triggerClassName="btn btn-outline"
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
                <button className="btn btn-outline" disabled type="button">
                  Rename
                </button>
              )}
              <button
                className="btn btn-ghost btn-square"
                type="button"
                aria-label={showTools ? "Hide profile tools" : "Show profile tools"}
                aria-expanded={showTools}
                onClick={() => setShowTools((current) => !current)}
              >
                <AppIcon name="Settings2" className="size-4" aria-hidden />
              </button>
            </div>
          </div>

          {showTools ? (
            <div className="border-base-300 bg-base-200/30 grid gap-3 rounded-xl border p-3">
              <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                <select
                  className="select select-bordered w-full"
                  value={leftProfileId}
                  onChange={(event) => setLeftProfileId(event.target.value)}
                  disabled={busy || profileOptions.length === 0}
                  aria-label="Compare left profile"
                >
                  {profileOptions.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name}
                    </option>
                  ))}
                </select>

                <select
                  className="select select-bordered w-full"
                  value={rightProfileId}
                  onChange={(event) => setRightProfileId(event.target.value)}
                  disabled={busy || profileOptions.length <= 1}
                  aria-label="Compare right profile"
                >
                  <option value="" disabled>
                    Select profile
                  </option>
                  {profileOptions
                    .filter((profile) => profile.id !== leftProfileId)
                    .map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.name}
                      </option>
                    ))}
                </select>

                <button
                  className="btn btn-outline"
                  type="button"
                  disabled={
                    busy ||
                    comparisonBusy ||
                    profileOptions.length <= 1 ||
                    !leftProfile ||
                    !rightProfile ||
                    leftProfile.id === rightProfile.id
                  }
                  onClick={() => {
                    void handleCompareProfiles();
                  }}
                >
                  {comparisonBusy ? "Comparing..." : "Compare"}
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  className="btn btn-outline btn-sm"
                  type="button"
                  disabled={busy || !activeProfile}
                  onClick={() =>
                    activeProfile && onExportModListProfile(activeProfile.id)
                  }
                >
                  Export
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  type="button"
                  disabled={busy}
                  onClick={onImportModListProfile}
                >
                  Import
                </button>
                {activeProfile ? (
                  <ConfirmAction
                    triggerLabel="Remove"
                    triggerClassName="btn btn-ghost btn-sm text-error"
                    confirmLabel="Remove profile"
                    title={`Remove ${activeProfile.name}?`}
                    description={
                      <p>
                        This removes the saved profile from app data. The app
                        will switch to another profile first if this one is
                        active.
                      </p>
                    }
                    disabled={busy || settings.modListProfiles.length <= 1}
                    onConfirm={() => onRemoveModListProfile(activeProfile.id)}
                  />
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <ProfileDiffDialog
        comparison={comparison}
        onClose={() => setComparison(null)}
      />
    </div>
  );
}
