import { listInstalledMods } from "./mod-installer";
import { fetchModFull } from "./portal/portal-api";
import { mapRelease } from "./portal/portal-mappers";
import type {
  DownloadRequest,
  ModDependency,
  ModReleaseSummary,
} from "@shared/types/mod";

interface ResolveDownloadPlanOptions {
  modName: string;
  version: string;
  targetFolder: string;
  replaceExisting: boolean;
  existingFilePath?: string | undefined;
  includeDependencies: boolean;
}

function findRelease(releases: ModReleaseSummary[], version: string) {
  return releases.find((release) => release.version === version);
}

function isRequiredDownloadableDependency(dependency: ModDependency): boolean {
  return dependency.kind === "required" && dependency.downloadable;
}

export async function resolveDownloadPlan(
  options: ResolveDownloadPlanOptions,
): Promise<DownloadRequest[]> {
  const installed = await listInstalledMods(options.targetFolder).catch(
    () => [],
  );
  const installedByName = new Map(installed.map((item) => [item.name, item]));
  const requests: DownloadRequest[] = [];
  const seen = new Set<string>();

  async function visit(
    modName: string,
    version: string,
    isRoot: boolean,
    explicitExistingFilePath?: string,
  ): Promise<void> {
    const key = `${modName}@${version}`;
    if (seen.has(key)) return;
    seen.add(key);

    const mod = await fetchModFull(modName);
    const releases = (mod.releases ?? []).map(mapRelease);
    const release = findRelease(releases, version);

    if (!release) {
      throw new Error(`Release ${version} for ${modName} was not found.`);
    }

    if (options.includeDependencies) {
      for (const dependency of release.dependencies.filter(
        isRequiredDownloadableDependency,
      )) {
        const dependencyMod = await fetchModFull(dependency.name);
        const dependencyVersion =
          dependencyMod.latest_release?.version ??
          dependencyMod.releases?.at(-1)?.version;

        if (!dependencyVersion) {
          throw new Error(
            `No downloadable release found for dependency ${dependency.name}.`,
          );
        }

        await visit(dependency.name, dependencyVersion, false);
      }
    }

    const installedEntry = installedByName.get(modName);
    requests.push({
      modName,
      version,
      targetFolder: options.targetFolder,
      replaceExisting: isRoot
        ? options.replaceExisting || Boolean(explicitExistingFilePath)
        : Boolean(installedEntry),
      ...(isRoot
        ? explicitExistingFilePath
          ? { existingFilePath: explicitExistingFilePath }
          : {}
        : installedEntry?.filePath
          ? { existingFilePath: installedEntry.filePath }
          : {}),
      ...(options.includeDependencies && !isRoot
        ? { includeDependencies: false }
        : {}),
    });
  }

  await visit(options.modName, options.version, true, options.existingFilePath);

  return requests;
}
