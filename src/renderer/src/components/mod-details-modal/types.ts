import type { ModDetails, ModReleaseSummary } from "@shared/types/mod";

/**
 * Represents a user's download selection for a mod release
 */
export interface ModDownloadSelection {
  /** The version of the mod to download */
  version: string;
  /** Whether to include required dependencies in the download */
  includeDependencies: boolean;
}

/**
 * Props for the ModDetailsModal component
 */
export interface ModDetailsModalProps {
  /** The mod details to display, or null if no mod is selected */
  mod: ModDetails | null;
  /** Whether the modal content is loading */
  loading?: boolean;
  /** The pending mod name while loading */
  pendingName?: string | null;
  /** Callback when the modal is closed */
  onClose(): void;
  /** Callback when a download is requested */
  onDownload(selection: ModDownloadSelection): void;
}

/** Tab types for the mod details modal */
export type ModalTab = "overview" | "dependencies" | "releases";

/**
 * Props for the OverviewTab component
 */
export interface OverviewTabProps {
  /** The full description of the mod in markdown format */
  description: string;
  /** Whether the description is fully expanded */
  descExpanded: boolean;
  /** Callback to open an external URL */
  onOpenExternal(url: string): void | Promise<void>;
  /** Callback when the expand/collapse toggle is clicked */
  onToggleExpanded(): void;
  /** A short summary of the mod */
  summary?: string;
}

/**
 * Props for the DependenciesTab component
 */
export interface DependenciesTabProps {
  /** The selected release to show dependencies for */
  release: ModReleaseSummary | null;
  /** Callback when a release download is requested */
  onDownload(release: ModReleaseSummary): void;
}

/**
 * Props for the ReleasesTab component
 */
export interface ReleasesTabProps {
  /** Whether the latest version is already downloaded */
  isLatestDownloaded: boolean;
  /** The latest release of the mod */
  latestRelease: ModReleaseSummary | null;
  /** The latest version string */
  latestVersion: string | null;
  /** Array of all available releases */
  releases: ModReleaseSummary[];
  /** The currently selected release version */
  selectedReleaseVersion: string | null;
  /** Callback when a release download is requested */
  onDownload(release: ModReleaseSummary): void;
  /** Callback when a release is selected */
  onSelectRelease(version: string): void;
}
