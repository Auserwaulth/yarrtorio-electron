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
  onQueryChange(value: string): void;
  onStatusFilterChange(value: StatusFilter): void;
  onUpdateAllOutdated(): void;
  onCheckUpdates(): void;
}

export type { StatusFilter };
