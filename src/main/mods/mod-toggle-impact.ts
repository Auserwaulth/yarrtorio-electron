import type {
  InstalledMod,
  ModDependency,
  ModToggleImpact,
} from "@shared/types/mod";
import { getModDetails } from "./mod-resolver";

function getInstalledReleaseDependencies(
  installedMod: InstalledMod,
  releases: Array<{ version: string; dependencies: ModDependency[] }>,
): ModDependency[] {
  const release =
    releases.find((item) => item.version === installedMod.version) ??
    releases[0];

  return release?.dependencies ?? [];
}

export async function getModToggleImpact(
  installed: InstalledMod[],
  modName: string,
  enabled: boolean,
): Promise<ModToggleImpact> {
  const targetMod = installed.find((item) => item.name === modName);

  if (!targetMod) {
    return {
      modName,
      enabled,
      relatedRequiredDependencies: [],
      dependentMods: [],
    };
  }

  if (enabled) {
    const details = await getModDetails(modName);
    const dependencies = getInstalledReleaseDependencies(targetMod, details.releases);
    const relatedRequiredDependencies = dependencies
      .filter((dependency) => dependency.kind === "required")
      .map((dependency) => dependency.name)
      .filter((dependencyName) => {
        const installedDependency = installed.find(
          (item) => item.name === dependencyName,
        );
        return installedDependency ? !(installedDependency.enabled ?? true) : false;
      });

    return {
      modName,
      enabled,
      relatedRequiredDependencies,
      dependentMods: [],
    };
  }

  const dependentMods: string[] = [];
  const enabledInstalled = installed.filter(
    (item) => item.name !== modName && (item.enabled ?? true),
  );
  const detailsResults = await Promise.allSettled(
    enabledInstalled.map((item) => getModDetails(item.name)),
  );

  for (let index = 0; index < enabledInstalled.length; index += 1) {
    const installedMod = enabledInstalled[index]!;
    const detailsResult = detailsResults[index];

    if (!detailsResult || !("value" in detailsResult)) {
      continue;
    }

    const dependencies = getInstalledReleaseDependencies(
      installedMod,
      detailsResult.value.releases,
    );

    if (
      dependencies.some(
        (dependency) =>
          dependency.kind === "required" && dependency.name === modName,
      )
    ) {
      dependentMods.push(installedMod.name);
    }
  }

  return {
    modName,
    enabled,
    relatedRequiredDependencies: [],
    dependentMods,
  };
}
