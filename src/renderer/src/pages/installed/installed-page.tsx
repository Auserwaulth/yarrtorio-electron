import { useMemo, useState } from "react";
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
  latestVersions: Record<string, string>;
  installedConflicts: Record<string, InstalledConflict[]>;
  onDelete(modName: string, filePath: string): void;
  onUpdate(modName: string, filePath: string): void;
  onToggleEnabled(modName: string, enabled: boolean, relatedModNames?: string[]): void;
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
}

export function InstalledPage({
  settings,
  items,
  busy,
  latestVersions,
  installedConflicts,
  onDelete,
  onUpdate,
  onToggleEnabled,
  onGetModToggleImpact,
  onOpen,
  onCheckUpdates,
  onCreateModListProfile,
  onRenameModListProfile,
  onSwitchModListProfile,
  onRemoveModListProfile,
}: InstalledPageProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [pendingToggle, setPendingToggle] = useState<ModToggleImpact | null>(null);
  const [selectedConflictModName, setSelectedConflictModName] = useState<string | null>(null);

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

  const needsUpdateCount = useMemo(
    () =>
      items.filter(
        (item) =>
          latestVersions[item.name] !== undefined &&
          latestVersions[item.name] !== item.version,
      ).length,
    [items, latestVersions],
  );

  const conflictedModCount = useMemo(
    () =>
      items.filter((item) => (installedConflicts[item.name]?.length ?? 0) > 0)
        .length,
    [installedConflicts, items],
  );

  const selectedConflicts = selectedConflictModName
    ? (installedConflicts[selectedConflictModName] ?? [])
    : [];

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
    const needsDisableWarning =
      !enabled && impact.dependentMods.length > 0;

    if (needsEnableConfirmation || needsDisableWarning) {
      setPendingToggle(impact);
      return;
    }

    onToggleEnabled(modName, enabled);
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
        />

        {conflictCount > 0 ? (
          <div className="border-error/30 bg-error/8 rounded-xl border p-4">
            <p className="text-error font-medium">
              {conflictCount} active conflict{conflictCount === 1 ? "" : "s"} detected
            </p>
            <p className="text-base-content/70 mt-1 text-sm">
              Conflict badges mark enabled installed mods that declare
              incompatibilities with other enabled installed mods.
            </p>
          </div>
        ) : null}

        <InstalledPageToolbar
          busy={busy}
          query={query}
          filteredCount={filteredItems.length}
          totalCount={items.length}
          statusFilter={statusFilter}
          needsUpdateCount={needsUpdateCount}
          conflictedCount={conflictedModCount}
          onQueryChange={setQuery}
          onStatusFilterChange={setStatusFilter}
          onCheckUpdates={onCheckUpdates}
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
          latestVersions={latestVersions}
          installedConflicts={installedConflicts}
          onDelete={onDelete}
          onUpdate={onUpdate}
          onOpen={onOpen}
          onToggleEnabled={(modName, enabled) => {
            void handleToggleEnabled(modName, enabled);
          }}
          onShowConflicts={setSelectedConflictModName}
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
