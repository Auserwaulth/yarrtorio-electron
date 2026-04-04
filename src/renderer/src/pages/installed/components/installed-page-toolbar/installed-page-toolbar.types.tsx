type StatusFilter =
  | "all"
  | "enabled"
  | "disabled"
  | "needs-update"
  | "conflicted";

export interface InstalledPageToolbarProps {
  busy: boolean;
  query: string;
  filteredCount: number;
  totalCount: number;
  statusFilter: StatusFilter;
  needsUpdateCount: number;
  conflictedCount: number;
  selectedCount: number;
  selectedOutdatedCount: number;
  onQueryChange(value: string): void;
  onStatusFilterChange(value: StatusFilter): void;
  onUpdateAllOutdated(): void;
  onCheckUpdates(): void;
  onUpdateSelected(): void;
  onDeleteSelected(): void | Promise<void>;
}

export type { StatusFilter };
