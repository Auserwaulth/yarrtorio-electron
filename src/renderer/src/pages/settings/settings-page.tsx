import { daisyThemes, featuredThemes } from "@shared/constants/themes";
import type { AppSettings } from "@shared/types/mod";
import type { AppMeta } from "@shared/types/app-meta";
import { BentoTile } from "../../components/bento-tile";

interface SettingsPageProps {
  settings: AppSettings;
  saving: boolean;
  appMeta?: AppMeta | null;
  onChange(settings: AppSettings): void;
  onPickFolder(): void;
  onPickModListFile(): void;
  onOpenLogFolder(): void;
}

const checkboxList = [
  {
    key: "ignoreDisabledMods",
    title: "Ignore disabled mods by default",
    description: "Keeps sync focused on active entries first.",
  },
  {
    key: "includeDisabledModsByDefault",
    title: "Still allow download of disabled mods",
    description: "Useful when you want archives ready before enabling them.",
  },
  {
    key: "desktopNotifications",
    title: "Desktop notifications",
    description: "Show a system notification when downloads finish or fail.",
  },
] as const;

export function SettingsPage({
  settings,
  saving,
  onChange,
  onPickFolder,
  onPickModListFile,
  onOpenLogFolder,
  appMeta,
}: SettingsPageProps) {
  return (
    <div className="grid gap-3 grid-cols-1 xl:grid-cols-4">
      <div className="grid xl:col-span-2 gap-2">
        <BentoTile title="Paths">
          <div className="grid gap-2">
            <div>
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Mod Folder</legend>
                <div className="join w-full">
                  <input
                    className="input input-bordered join-item w-full min-w-0 blur-sm hover:blur-none transition-all"
                    value={settings.modsFolder}
                    readOnly
                    placeholder="Mod Folder"
                  />
                  <button className="btn join-item" onClick={onPickFolder}>
                    Browse
                  </button>
                </div>
              </fieldset>
            </div>

            <div>
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Mod-list.json path</legend>
                <div className="join w-full">
                  <input
                    className="input input-bordered join-item w-full min-w-0 blur-sm hover:blur-none transition-all"
                    value={settings.modListPath}
                    readOnly
                    placeholder="mod-list.json path (optional)"
                  />
                  <button className="btn join-item" onClick={onPickModListFile}>
                    Browse
                  </button>
                </div>
              </fieldset>
            </div>

            <div className="rounded-xl border border-base-300 bg-base-200/70 p-4 text-sm text-base-content/70">
              Leave the mod-list.json path empty to use the default location in
              the Factorio user data folder.
            </div>
          </div>
        </BentoTile>

        <BentoTile title="Appearance">
          <fieldset className="w-full">
            <legend className="fieldset-legend">Snackbar Position</legend>

            <select
              className="select select-bordered w-full"
              value={settings.snackbarPosition}
              onChange={(event) =>
                onChange({
                  ...settings,
                  snackbarPosition: event.target
                    .value as AppSettings["snackbarPosition"],
                })
              }
            >
              <option value="top-left">Top Left</option>
              <option value="top-right">Top Right</option>
              <option value="bottom-left">Bottom Left</option>
              <option value="bottom-right">Bottom Right</option>
            </select>
          </fieldset>
        </BentoTile>
      </div>

      <BentoTile title="Download behavior" className="xl:col-span-2">
        <div className="space-y-4">
          <fieldset className="w-full max-w-xs">
            <legend className="fieldset-legend">Concurrency</legend>
            <div className="join w-full">
              <input
                className="range"
                type="range"
                min={1}
                max={8}
                value={settings.concurrency}
                onChange={(event) =>
                  onChange({
                    ...settings,
                    concurrency: Number(event.target.value),
                  })
                }
              />
            </div>

            <div className="flex justify-between px-2.5 mt-2 text-xs">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                <span
                  key={num}
                  className={
                    num === settings.concurrency
                      ? "font-semibold text-base-content"
                      : ""
                  }
                >
                  {num}
                </span>
              ))}
            </div>
          </fieldset>
          <div className="rounded-xl border border-base-300 bg-base-200/70 p-4 text-sm text-base-content/70 w-full">
            Adjust how many mods to download simultaneously. Higher concurrency
            can speed up the process, but may cause more strain on your system
            and increase the chance of download failures. Start lower if you
            have a slower connection or experience issues.
          </div>

          <div className="flex flex-col gap-3">
            {checkboxList.map((item) => (
              <label
                key={item.key}
                className="label cursor-pointer justify-start gap-3 rounded-xl border border-base-300 bg-base-200/70 px-4 py-4"
              >
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary shrink-0"
                  checked={settings[item.key]}
                  onChange={(event) =>
                    onChange({
                      ...settings,
                      [item.key]: event.target.checked,
                    })
                  }
                />

                <div className="min-w-0 flex-1">
                  <p className="font-medium flex flex-wrap">{item.title}</p>
                  <p className="text-xs text-base-content/60">
                    {item.description}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </BentoTile>

      <BentoTile
        title="Theme"
        className="xl:col-span-4 overflow-x-auto max-h-[60vh] overflow-y-auto"
      >
        <div className="space-y-4">
          <select
            className="select select-bordered w-full md:max-w-xs hidden"
            value={settings.theme}
            onChange={(event) =>
              onChange({
                ...settings,
                theme: event.target.value as AppSettings["theme"],
              })
            }
          >
            <option value="system">system</option>
            {daisyThemes.map((theme) => (
              <option key={theme} value={theme}>
                {theme}
              </option>
            ))}
          </select>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <button
              className={`rounded-xl border p-4 text-left transition ${settings.theme === "system" ? "border-primary bg-primary/10" : "border-base-300 bg-base-200/60 hover:bg-base-200"}`}
              onClick={() => onChange({ ...settings, theme: "system" })}
            >
              <p className="font-semibold capitalize">System</p>
              <p className="mt-1 text-xs text-base-content/60">
                Follow your device preference.
              </p>
            </button>
            {featuredThemes.map((theme) => (
              <button
                key={theme}
                className={`rounded-xl border p-4 text-left transition ${settings.theme === theme ? "border-primary bg-primary/10" : "border-base-300 bg-base-200/60 hover:bg-base-200"}`}
                onClick={() => onChange({ ...settings, theme })}
              >
                <div className="mb-3 flex gap-2">
                  <span
                    className="h-3 w-3 rounded-full bg-primary"
                    data-theme={theme}
                  />
                  <span
                    className="h-3 w-3 rounded-full bg-secondary"
                    data-theme={theme}
                  />
                  <span
                    className="h-3 w-3 rounded-full bg-accent"
                    data-theme={theme}
                  />
                </div>
                <p className="font-semibold capitalize">{theme}</p>
                <p className="mt-1 text-xs text-base-content/60">
                  Preview-ready built-in theme.
                </p>
              </button>
            ))}
          </div>
        </div>
      </BentoTile>

      <BentoTile title="Logs & bug reports" className="xl:col-span-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="text-sm text-base-content/70">
              Attach this log file when reporting bugs.
            </p>
            <input
              className="input input-bordered mt-3 w-full blur-sm transition-all hover:blur-none"
              value={
                appMeta?.logPath ?? "Log file will appear after app startup."
              }
              readOnly
            />
          </div>
          <button className="btn" type="button" onClick={onOpenLogFolder}>
            Open log location
          </button>
        </div>
      </BentoTile>

      <div className="xl:col-span-4 flex justify-end">
        <button
          className="btn btn-primary"
          disabled={saving}
          onClick={() => onChange(settings)}
        >
          {saving ? "Saving…" : "Save locally"}
        </button>
      </div>
    </div>
  );
}
