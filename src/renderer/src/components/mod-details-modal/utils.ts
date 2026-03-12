import type {
  ModDependency,
  ModDependencyKind,
  ModDetails,
  ModReleaseSummary,
} from "@shared/types/mod";

export const TAB_LABELS = {
  overview: "Overview",
  dependencies: "Dependencies",
  releases: "Releases",
} as const;

export const DEPENDENCY_KIND_LABELS: Record<ModDependencyKind, string> = {
  required: "Required",
  optional: "Optional",
  "hidden-optional": "Hidden optional",
  incompatible: "Incompatible",
};

export const DEPENDENCY_BADGE_CLASS: Record<ModDependencyKind, string> = {
  required: "badge-primary",
  optional: "badge-info",
  "hidden-optional": "badge-accent",
  incompatible: "badge-error",
};

export function formatReleaseDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export function getPortalUrl(mod: ModDetails): string {
  return `https://mods.factorio.com/mod/${encodeURIComponent(mod.name)}`;
}

export function getDisplayUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function describeDependency(dependency: ModDependency): string {
  return dependency.versionConstraint
    ? `${dependency.name} ${dependency.versionConstraint}`
    : dependency.name;
}

export function getReleaseDependencies(
  release: ModReleaseSummary | null | undefined,
): ModDependency[] {
  const dependencies = release?.dependencies;
  return Array.isArray(dependencies) ? dependencies : [];
}

export function getDependenciesByKind(
  release: ModReleaseSummary | null | undefined,
  kind: ModDependencyKind,
): ModDependency[] {
  return getReleaseDependencies(release).filter(
    (dependency) => dependency.kind === kind,
  );
}

export function getInstallableDependencies(
  release: ModReleaseSummary | null | undefined,
): ModDependency[] {
  return getDependenciesByKind(release, "required").filter(
    (dependency) => dependency.downloadable,
  );
}

export function getSkippedDependencies(
  release: ModReleaseSummary | null | undefined,
): ModDependency[] {
  return getDependenciesByKind(release, "required").filter(
    (dependency) => !dependency.downloadable,
  );
}
