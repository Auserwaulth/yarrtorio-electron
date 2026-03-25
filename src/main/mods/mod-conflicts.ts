import type {
  InstalledConflict,
  InstalledMod,
  ModDependency,
} from "@shared/types/mod";
import { getModReleaseSummaries } from "./mod-resolver";

function getInstalledReleaseDependencies(
  installedMod: InstalledMod,
  releases: Array<{ version: string; dependencies: ModDependency[] }>,
): ModDependency[] {
  const release =
    releases.find((item) => item.version === installedMod.version) ??
    releases[0];

  return release?.dependencies ?? [];
}

export async function detectInstalledConflicts(
  installed: InstalledMod[],
): Promise<Record<string, InstalledConflict[]>> {
  const enabledInstalled = installed.filter((item) => item.enabled ?? true);

  if (enabledInstalled.length === 0) {
    return {};
  }

  const detailsResults = await Promise.allSettled(
    enabledInstalled.map((item) => getModReleaseSummaries(item.name)),
  );
  const enabledNames = new Set(enabledInstalled.map((item) => item.name));
  const conflicts = new Map<string, InstalledConflict[]>();

  for (let index = 0; index < enabledInstalled.length; index += 1) {
    const installedMod = enabledInstalled[index]!;
    const detailsResult = detailsResults[index];

    if (!detailsResult || !("value" in detailsResult)) {
      continue;
    }

    const dependencies = getInstalledReleaseDependencies(
      installedMod,
      detailsResult.value,
    );

    for (const dependency of dependencies) {
      if (dependency.kind !== "incompatible") continue;
      if (!enabledNames.has(dependency.name)) continue;

      const existing = conflicts.get(installedMod.name) ?? [];
      existing.push({
        modName: installedMod.name,
        conflictsWith: dependency.name,
        reason: dependency.raw,
        source: "declared-incompatibility",
      });
      conflicts.set(installedMod.name, existing);
    }
  }

  return Object.fromEntries(conflicts);
}
