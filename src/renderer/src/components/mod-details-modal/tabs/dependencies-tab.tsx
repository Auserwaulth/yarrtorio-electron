import { DependencyList } from "../components/dependency-list";
import type { DependenciesTabProps } from "../types";
import {
  getDependenciesByKind,
  getInstallableDependencies,
  getSkippedDependencies,
} from "../utils";

/**
 * A tab component that displays all dependencies for a mod release.
 * Shows required, optional, hidden optional, and incompatible dependencies,
 * as well as which ones will be auto-downloaded or skipped.
 *
 * @param props - Component props
 * @param props.release - The selected release to show dependencies for
 * @param props.onDownload - Callback to download a release
 *
 * @example
 * <DependenciesTab
 *   release={selectedRelease}
 *   onDownload={(r) => download(r)}
 * />
 */
export function DependenciesTab({ release, onDownload }: DependenciesTabProps) {
  const requiredDependencies = getDependenciesByKind(release, "required");
  const optionalDependencies = getDependenciesByKind(release, "optional");
  const hiddenOptionalDependencies = getDependenciesByKind(
    release,
    "hidden-optional",
  );
  const incompatibleDependencies = getDependenciesByKind(
    release,
    "incompatible",
  );
  const installableDependencies = getInstallableDependencies(release);
  const skippedDependencies = getSkippedDependencies(release);

  return (
    <div className="space-y-4">
      <div className="bg-base-200 rounded-2xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-lg font-bold">
              Dependencies for {release?.version ?? "No release"}
            </h4>
            <p className="text-base-content/60 text-sm">
              Required dependencies can be auto-downloaded. Built-in or official
              content is listed but skipped.
            </p>
          </div>

          {release ? (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => onDownload(release)}
            >
              Download this release
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <DependencyList
          title="Required"
          description="Needed for the mod to work."
          emptyLabel="No required dependencies declared."
          items={requiredDependencies}
        />
        <DependencyList
          title="Optional"
          description="Extra integrations or nice-to-have support."
          emptyLabel="No optional dependencies declared."
          items={optionalDependencies}
        />
        <DependencyList
          title="Hidden optional"
          description="Optional integrations usually hidden from the normal UI."
          emptyLabel="No hidden optional dependencies declared."
          items={hiddenOptionalDependencies}
        />
        <DependencyList
          title="Incompatible"
          description="Known conflicts or mutually exclusive mods."
          emptyLabel="No incompatible mods declared."
          items={incompatibleDependencies}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <DependencyList
          title="Will be auto-downloaded"
          emptyLabel="This release does not have downloadable required dependencies."
          items={installableDependencies}
        />
        <DependencyList
          title="Will be skipped"
          emptyLabel="No required dependencies are being skipped."
          items={skippedDependencies}
        />
      </div>
    </div>
  );
}
