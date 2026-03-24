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

const colors = ["bg-primary", "bg-secondary", "bg-accent", "bg-accent-content"];

export function SettingsPage({
  settings,
  saving,
  onChange,
  onPickFolder,
  onOpenLogFolder,
  appMeta,
}: SettingsPageProps) {
  return (
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-4">
      <div className="grid gap-2 xl:col-span-2">
        <BentoTile title="Paths">
          <div className="grid gap-2">
            <div>
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Mod Folder</legend>
                <div className="join w-full">
                  <input
                    className="input input-bordered join-item w-full min-w-0 blur-sm transition-all hover:blur-none"
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

            <div className="border-base-300 bg-base-200/70 text-base-content/70 rounded-xl border p-4 text-sm">
              Mod-list profiles are managed from the Installed page. The active
              profile swaps the real `mod-list.json` inside this mods folder.
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

            <div className="mt-2 flex justify-between px-2.5 text-xs">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                <span
                  key={num}
                  className={
                    num === settings.concurrency
                      ? "text-base-content font-semibold"
                      : ""
                  }
                >
                  {num}
                </span>
              ))}
            </div>
          </fieldset>
          <div className="border-base-300 bg-base-200/70 text-base-content/70 w-full rounded-xl border p-4 text-sm">
            Adjust how many mods to download simultaneously. Higher concurrency
            can speed up the process, but may cause more strain on your system
            and increase the chance of download failures. Start lower if you
            have a slower connection or experience issues.
          </div>

          <div className="flex flex-col gap-3">
            {checkboxList.map((item) => (
              <label
                key={item.key}
                className="label border-base-300 bg-base-200/70 cursor-pointer justify-start gap-3 rounded-xl border px-4 py-4"
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
                  <p className="flex flex-wrap font-medium">{item.title}</p>
                  <p className="text-base-content/60 text-xs">
                    {item.description}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </BentoTile>

      <BentoTile title="Theme" className="xl:col-span-4">
        <div className="max-h-[60vh] space-y-4 overflow-x-auto overflow-y-auto">
          <select
            className="select select-bordered hidden w-full md:max-w-xs"
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
              <p className="text-base-content/60 mt-1 text-xs">
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
                  {colors.map((color) => (
                    <span
                      key={color}
                      className={[color, "h-3 w-3 rounded-full"].join(" ")}
                      data-theme={theme}
                    />
                  ))}
                </div>
                <p className="font-semibold capitalize">{theme}</p>
                <p className="text-base-content/60 mt-1 text-xs">
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
            <p className="text-base-content/70 text-sm">
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

      <div className="flex justify-end xl:col-span-4">
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
