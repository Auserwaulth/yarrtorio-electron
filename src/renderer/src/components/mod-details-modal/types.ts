import type { ModDetails, ModReleaseSummary } from "@shared/types/mod";

export interface ModDownloadSelection {
  version: string;
  includeDependencies: boolean;
}

export interface ModDetailsModalProps {
  mod: ModDetails | null;
  loading?: boolean;
  pendingName?: string | null;
  onClose(): void;
  onDownload(selection: ModDownloadSelection): void;
}

export type ModalTab = "overview" | "dependencies" | "releases";

export interface OverviewTabProps {
  description: string;
  descExpanded: boolean;
  onOpenExternal(url: string): void | Promise<void>;
  onToggleExpanded(): void;
  summary?: string;
}

export interface DependenciesTabProps {
  release: ModReleaseSummary | null;
  onDownload(release: ModReleaseSummary): void;
}

export interface ReleasesTabProps {
  isLatestDownloaded: boolean;
  latestRelease: ModReleaseSummary | null;
  latestVersion: string | null;
  releases: ModReleaseSummary[];
  selectedReleaseVersion: string | null;
  onDownload(release: ModReleaseSummary): void;
  onSelectRelease(version: string): void;
}
