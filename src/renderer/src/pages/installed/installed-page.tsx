import { useEffect, useMemo, useState } from "react";
import { BentoTile } from "../../components/bento-tile";
import { FadeSkeleton } from "../../components/fade-skeleton";
import type {
  AppSettings,
  InstalledConflict,
  InstalledMod,
  ModToggleImpact,
} from "@shared/types/mod";
import { ConflictDetailsDialog } from "./components/conflict-details-dialog";
import { InstalledModsTable } from "./components/installed-mods-table";
import { InstalledPageSkeleton } from "./components/installed-page-skeleton";
import { InstalledPageToolbar } from "./components/installed-page-toolbar";
import type { StatusFilter } from "./components/installed-page-toolbar";
import { ModListPanel } from "./components/mod-list-panel";
import { ToggleImpactDialog } from "./components/toggle-impact-dialog";

interface InstalledPageProps {
  settings: AppSettings;
  items: InstalledMod[];
  busy: boolean;
  pendingModNames: string[];
  latestVersions: Record<string, string>;
  installedConflicts: Record<string, InstalledConflict[]>;
  onDelete(modName: string, fileName: string): Promise<void>;
  onDeleteMany(entries: Array<{ modName: string; fileName: string }>): Promise<void>;
  onUpdate(modName: string, fileName: string): Promise<void>;
  onUpdateMany(entries: Array<{ modName: string; fileName: string }>): Promise<void>;
  onUpdateAllOutdated(): void;
  onToggleEnabled(
    modName: string,
    enabled: boolean,
    relatedModNames?: string[],
  ): Promise<void>;
  onGetModToggleImpact(
    modName: string,
    enabled: boolean,
  ): Promise<ModToggleImpact | null>;
  onOpen(modName: string): void;
  onCheckUpdates(): void;
  onCreateModListProfile(name: string): void;
  onRenameModListProfile(profileId: string, name: string): void;
  onSwitchModListProfile(profileId: string): void;
  onRemoveModListProfile(profileId: string): void;
  onDiffModListProfiles(
    leftProfileId: string,
    rightProfileId: string,
  ): Promise<import("@shared/types/mod").ModListProfileComparison | null>;
  onExportModListProfile(profileId: string): void;
  onImportModListProfile(): void;
}

export function InstalledPage({
  settings,
  items,
  busy,
  pendingModNames,
  latestVersions,
  installedConflicts,
  onDelete,
  onDeleteMany,
  onUpdate,
  onUpdateMany,
  onUpdateAllOutdated,
  onToggleEnabled,
  onGetModToggleImpact,
  onOpen,
  onCheckUpdates,
  onCreateModListProfile,
  onRenameModListProfile,
  onSwitchModListProfile,
  onRemoveModListProfile,
  onDiffModListProfiles,
  onExportModListProfile,
  onImportModListProfile,
}: InstalledPageProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [pendingToggle, setPendingToggle] = useState<ModToggleImpact | null>(
    null,
  );
  const [selectedFilePaths, setSelectedFilePaths] = useState<string[]>([]);
  const [selectedConflictModName, setSelectedConflictModName] = useState<
    string | null
  >(null);

  const filteredItems = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return items.filter((item) => {
      const matchesQuery =
        !needle ||
        item.name.toLowerCase().includes(needle) ||
        item.fileName.toLowerCase().includes(needle);

      const isEnabled = item.enabled ?? true;
      const hasUpdate =
        latestVersions[item.name] !== undefined &&
        latestVersions[item.name] !== item.version;
      const hasConflict = (installedConflicts[item.name]?.length ?? 0) > 0;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "enabled" && isEnabled) ||
        (statusFilter === "disabled" && !isEnabled) ||
        (statusFilter === "needs-update" && hasUpdate) ||
        (statusFilter === "conflicted" && hasConflict);

      return matchesQuery && matchesStatus;
    });
  }, [installedConflicts, items, latestVersions, query, statusFilter]);

  const conflictCount = useMemo(
    () =>
      Object.values(installedConflicts).reduce(
        (count, conflicts) => count + conflicts.length,
        0,
      ),
    [installedConflicts],
  );

  const conflictedModCount = useMemo(
    () =>
      items.filter((item) => (installedConflicts[item.name]?.length ?? 0) > 0)
        .length,
    [installedConflicts, items],
  );

  const outdatedItems = useMemo(
    () =>
      items.filter(
        (item) =>
          latestVersions[item.name] !== undefined &&
          latestVersions[item.name] !== item.version,
      ),
    [items, latestVersions],
  );

  const selectedConflicts = selectedConflictModName
    ? (installedConflicts[selectedConflictModName] ?? [])
    : [];
  const selectedItems = filteredItems.filter((item) =>
    selectedFilePaths.includes(item.filePath),
  );
  const selectedOutdatedItems = selectedItems.filter(
    (item) =>
      latestVersions[item.name] !== undefined &&
      latestVersions[item.name] !== item.version,
  );
  const allFilteredSelected =
    filteredItems.length > 0 && selectedItems.length === filteredItems.length;

  useEffect(() => {
    const availableFilePaths = new Set(filteredItems.map((item) => item.filePath));
    setSelectedFilePaths((current) =>
      current.filter((filePath) => availableFilePaths.has(filePath)),
    );
  }, [filteredItems]);

  async function handleToggleEnabled(
    modName: string,
    enabled: boolean,
  ): Promise<void> {
    const impact = await onGetModToggleImpact(modName, enabled);

    if (!impact) {
      return;
    }

    const needsEnableConfirmation =
      enabled && impact.relatedRequiredDependencies.length > 0;
    const needsDisableWarning = !enabled && impact.dependentMods.length > 0;

    if (needsEnableConfirmation || needsDisableWarning) {
      setPendingToggle(impact);
      return;
    }

    onToggleEnabled(modName, enabled);
  }

  function toggleSelectedFilePath(filePath: string): void {
    setSelectedFilePaths((current) =>
      current.includes(filePath)
        ? current.filter((value) => value !== filePath)
        : [...current, filePath],
    );
  }

  function toggleSelectAllFiltered(): void {
    setSelectedFilePaths((current) =>
      allFilteredSelected ? [] : filteredItems.map((item) => item.filePath),
    );
  }

  return (
    <BentoTile title="Installed archives">
      <div className="mb-4 flex flex-col gap-3">
        <ModListPanel
          settings={settings}
          busy={busy}
          conflictCount={conflictCount}
          onCreateModListProfile={onCreateModListProfile}
          onRenameModListProfile={onRenameModListProfile}
          onSwitchModListProfile={onSwitchModListProfile}
          onRemoveModListProfile={onRemoveModListProfile}
          onDiffModListProfiles={onDiffModListProfiles}
          onExportModListProfile={onExportModListProfile}
          onImportModListProfile={onImportModListProfile}
        />

        <InstalledPageToolbar
          busy={busy}
          query={query}
          filteredCount={filteredItems.length}
          totalCount={items.length}
          statusFilter={statusFilter}
          needsUpdateCount={outdatedItems.length}
          conflictedCount={conflictedModCount}
          selectedCount={selectedItems.length}
          selectedOutdatedCount={selectedOutdatedItems.length}
          onQueryChange={setQuery}
          onStatusFilterChange={setStatusFilter}
          onUpdateAllOutdated={onUpdateAllOutdated}
          onCheckUpdates={onCheckUpdates}
          onUpdateSelected={() => {
            void onUpdateMany(
              selectedOutdatedItems.map((item) => ({
                modName: item.name,
                fileName: item.fileName,
              })),
            ).then(() => setSelectedFilePaths([]));
          }}
          onDeleteSelected={async () => {
            await onDeleteMany(
              selectedItems.map((item) => ({
                modName: item.name,
                fileName: item.fileName,
              })),
            );
            setSelectedFilePaths([]);
          }}
        />
      </div>

      <FadeSkeleton
        loading={busy}
        skeleton={<InstalledPageSkeleton />}
        minHeight="20rem"
      >
        <InstalledModsTable
          items={items}
          filteredItems={filteredItems}
          busy={busy}
          pendingModNames={pendingModNames}
          latestVersions={latestVersions}
          installedConflicts={installedConflicts}
          onDelete={onDelete}
          onUpdate={onUpdate}
          onOpen={onOpen}
          onToggleEnabled={(modName, enabled) => {
            void handleToggleEnabled(modName, enabled);
          }}
          onShowConflicts={setSelectedConflictModName}
          selectedFilePaths={selectedFilePaths}
          onToggleSelectedFilePath={toggleSelectedFilePath}
          allFilteredSelected={allFilteredSelected}
          onToggleSelectAllFiltered={toggleSelectAllFiltered}
        />
      </FadeSkeleton>

      <ToggleImpactDialog
        impact={pendingToggle}
        onClose={() => setPendingToggle(null)}
        onConfirm={(modName, enabled, relatedModNames) => {
          onToggleEnabled(modName, enabled, relatedModNames);
          setPendingToggle(null);
        }}
      />

      <ConflictDetailsDialog
        modName={selectedConflictModName}
        conflicts={selectedConflicts}
        onClose={() => setSelectedConflictModName(null)}
        onOpenMod={(modName) => {
          onOpen(modName);
          setSelectedConflictModName(null);
        }}
      />
    </BentoTile>
  );
}
