import type {
  ModDependency,
  ModDependencyKind,
  ModDetails,
  ModReleaseSummary,
} from "@shared/types/mod";

/** Labels for the modal tabs */
export const TAB_LABELS = {
  overview: "Overview",
  dependencies: "Dependencies",
  releases: "Releases",
} as const;

/** Labels for dependency kinds */
export const DEPENDENCY_KIND_LABELS: Record<ModDependencyKind, string> = {
  required: "Required",
  optional: "Optional",
  "hidden-optional": "Hidden optional",
  incompatible: "Incompatible",
};

/** CSS badge classes for dependency kinds */
export const DEPENDENCY_BADGE_CLASS: Record<ModDependencyKind, string> = {
  required: "badge-primary",
  optional: "badge-info",
  "hidden-optional": "badge-accent",
  incompatible: "badge-error",
};

/**
 * Formats a release date string for display.
 * @param value - ISO date string
 * @returns Formatted date string or original value if invalid
 */
export function formatReleaseDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

/**
 * Generates the Factorio mod portal URL for a mod.
 * @param mod - The mod details
 * @returns The portal URL
 */
export function getPortalUrl(mod: ModDetails): string {
  return `https://mods.factorio.com/mod/${encodeURIComponent(mod.name)}`;
}

/**
 * Extracts a display-friendly hostname from a URL.
 * @param url - The full URL
 * @returns The hostname without www prefix, or original string if invalid
 */
export function getDisplayUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/**
 * Creates a human-readable description of a mod dependency.
 * @param dependency - The dependency to describe
 * @returns Description string with name and optional version constraint
 */
export function describeDependency(dependency: ModDependency): string {
  return dependency.versionConstraint
    ? `${dependency.name} ${dependency.versionConstraint}`
    : dependency.name;
}

/**
 * Gets all dependencies from a release.
 * @param release - The release to get dependencies from
 * @returns Array of dependencies (empty array if none)
 */
export function getReleaseDependencies(
  release: ModReleaseSummary | null | undefined,
): ModDependency[] {
  const dependencies = release?.dependencies;
  return Array.isArray(dependencies) ? dependencies : [];
}

/**
 * Gets dependencies filtered by kind (required, optional, etc.).
 * @param release - The release to get dependencies from
 * @param kind - The kind of dependencies to filter
 * @returns Array of matching dependencies
 */
export function getDependenciesByKind(
  release: ModReleaseSummary | null | undefined,
  kind: ModDependencyKind,
): ModDependency[] {
  return getReleaseDependencies(release).filter(
    (dependency) => dependency.kind === kind,
  );
}

/**
 * Gets required dependencies that can be automatically downloaded.
 * @param release - The release to get dependencies from
 * @returns Array of installable required dependencies
 */
export function getInstallableDependencies(
  release: ModReleaseSummary | null | undefined,
): ModDependency[] {
  return getDependenciesByKind(release, "required").filter(
    (dependency) => dependency.downloadable,
  );
}

/**
 * Gets required dependencies that will NOT be automatically downloaded
 * (e.g., built-in or official content).
 * @param release - The release to get dependencies from
 * @returns Array of skipped required dependencies
 */
export function getSkippedDependencies(
  release: ModReleaseSummary | null | undefined,
): ModDependency[] {
  return getDependenciesByKind(release, "required").filter(
    (dependency) => !dependency.downloadable,
  );
}
