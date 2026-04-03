import type { ThemeMode } from "../constants/themes.ts";
export type DownloadState =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export interface AppSettings {
  version: number;
  modsFolder: string;
  factorioPath: string;
  modListProfiles: ModListProfile[];
  activeModListProfileId: string;
  snackbarPosition: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  concurrency: number;
  ignoreDisabledMods: boolean;
  includeDisabledModsByDefault: boolean;
  desktopNotifications: boolean;
  theme: ThemeMode;
}

export interface ModListProfile {
  id: string;
  name: string;
}

export interface ModLibraryState {
  isInstalled: boolean;
  isInModList: boolean;
  isEnabledInModList: boolean;
}

export interface ModListEntry {
  name: string;
  enabled: boolean;
  version?: string | undefined;
}

export interface InstalledMod {
  name: string;
  version: string;
  fileName: string;
  filePath: string;
  enabled?: boolean;
  managedByModList?: boolean;
}

export interface InstalledConflict {
  modName: string;
  conflictsWith: string;
  reason: string;
  source: "declared-incompatibility";
}

export interface ModToggleImpact {
  modName: string;
  enabled: boolean;
  relatedRequiredDependencies: string[];
  dependentMods: string[];
}

export const modPortalTabs = [
  "recently_updated",
  "most_downloaded",
  "trending",
  "highlighted",
  "search",
] as const;

export type ModPortalTab = (typeof modPortalTabs)[number];

export const factorioVersions = [
  "any",
  "2.0",
  "1.1",
  "1.0",
  "0.18",
  "0.17",
  "0.16",
  "0.15",
  "0.14",
  "0.13",
] as const;

export type FactorioVersion = (typeof factorioVersions)[number];

export const modCategories = [
  "content",
  "overhaul",
  "tweaks",
  "utilities",
  "scenarios",
  "mod-packs",
  "localizations",
  "internal",
  "no-category",
] as const;

export type ModCategory = (typeof modCategories)[number];

export const modTags = [
  "planets",
  "transportation",
  "logistics",
  "trains",
  "combat",
  "armor",
  "character",
  "enemies",
  "environment",
  "mining",
  "fluids",
  "logistic-network",
  "circuit-network",
  "manufacturing",
  "power",
  "storage",
  "blueprints",
  "cheats",
] as const;

export type ModTag = (typeof modTags)[number];

export interface BrowseFilters {
  query: string;
  page: number;
  pageSize: number;
  tab: ModPortalTab;
  version: FactorioVersion;
  categories: ModCategory[];
  includeCategories: boolean;
  tags: ModTag[];
  includeTags: boolean;
  includeDeprecated: boolean;
}

export interface BrowsePagination {
  count: number;
  page: number;
  pageCount: number;
  pageSize: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface BrowseResult {
  items: ModSummary[];
  pagination: BrowsePagination;
}

export interface FactorioRelease {
  version: string;
  releasedAt: string;
  downloadPath: string;
  fileName: string;
}

export type ModDependencyKind =
  | "required"
  | "optional"
  | "hidden-optional"
  | "incompatible";

export interface ModDependency {
  raw: string;
  name: string;
  kind: ModDependencyKind;
  versionConstraint?: string | undefined;
  downloadable: boolean;
  reasonSkipped?: string | undefined;
}

export interface ModReleaseSummary {
  version: string;
  factorioVersion?: string;
  releasedAt: string;
  downloadPath: string;
  fileName: string;
  dependencies: ModDependency[];
}

export interface ModSummary {
  name: string;
  title: string;
  summary: string;
  owner: string;
  category?: ModCategory;
  tags: ModTag[];
  downloadsCount?: number;
  score?: number;
  thumbnail?: string;
  updatedAt?: string;
  lastHighlightedAt?: string;
  latestRelease?: ModReleaseSummary;
  libraryState?: ModLibraryState;
}

export interface ModDetails extends ModSummary {
  description: string;
  releases: ModReleaseSummary[];
  sourceUrl?: string;
  homepageUrl?: string;
  licenseName?: string;
  licenseUrl?: string;
  images?: string[];
}

export interface DownloadRequest {
  modName: string;
  version: string;
  targetFolder: string;
  replaceExisting: boolean;
  existingFilePath?: string;
  includeDependencies?: boolean;
}

export interface DownloadEnqueueInput {
  modName: string;
  version: string;
  includeDependencies?: boolean;
}

export interface BulkUpdateInstalledResult {
  checkedCount: number;
  queuedCount: number;
  upToDateCount: number;
  unavailableMods: string[];
  unmanagedMods: string[];
  failedMods: Array<{
    modName: string;
    error: string;
  }>;
  queuedModNames: string[];
}

export interface DownloadProgress {
  key: string;
  modName: string;
  version: string;
  transferredBytes: number;
  totalBytes: number;
  percent: number;
  state: DownloadState;
  message?: string;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

export type OperationResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: string;
    };
