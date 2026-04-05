import { resolvePathWithinFolder } from "./mod-paths.ts";
import { mapRelease } from "./portal/portal-mappers.ts";
import type {
  DownloadRequest,
  ModDependency,
  ModReleaseSummary,
} from "../../shared/types/mod.ts";
import type { ApiMod, ApiRelease } from "./portal/portal-types.ts";

interface ResolveDownloadPlanOptions {
  modName: string;
  version: string;
  targetFolder: string;
  replaceExisting: boolean;
  existingFilePath?: string | undefined;
  includeDependencies: boolean;
}

interface ResolveDownloadPlanDependencies {
  ensureAccessibleModsFolder(folder: string): Promise<string>;
  listInstalledMods(
    targetFolder: string,
  ): Promise<Array<{ name: string; filePath: string }>>;
  resolvePathWithinFolder(targetFolder: string, candidate: string): string;
  fetchModFull(modName: string): Promise<ApiMod>;
}

const defaultDependencies: ResolveDownloadPlanDependencies = {
  ensureAccessibleModsFolder: async (folder) => {
    const module = await import("./mod-paths.ts");
    return module.ensureAccessibleModsFolder(folder);
  },
  listInstalledMods: async (targetFolder) => {
    const module = await import("./mod-installer.ts");
    return module.listInstalledMods(targetFolder);
  },
  resolvePathWithinFolder: (targetFolder, candidate) => {
    return resolvePathWithinFolder(targetFolder, candidate);
  },
  fetchModFull: async (modName) => {
    const module = await import("./portal/portal-api.ts");
    return module.fetchModFull(modName);
  },
};

function findRelease(releases: ModReleaseSummary[], version: string) {
  return releases.find((release) => release.version === version);
}

function isRequiredDownloadableDependency(dependency: ModDependency): boolean {
  return dependency.kind === "required" && dependency.downloadable;
}

export async function resolveDownloadPlan(
  options: ResolveDownloadPlanOptions,
  dependencies: ResolveDownloadPlanDependencies = defaultDependencies,
): Promise<DownloadRequest[]> {
  const targetFolder = await dependencies.ensureAccessibleModsFolder(
    options.targetFolder,
  );
  const installed = await dependencies.listInstalledMods(targetFolder);
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

    if (isRoot && explicitExistingFilePath) {
      dependencies.resolvePathWithinFolder(
        targetFolder,
        explicitExistingFilePath,
      );
    }

    const mod = await dependencies.fetchModFull(modName);
    const releases = ((mod.releases ?? []) as ApiRelease[]).map(mapRelease);
    const release = findRelease(releases, version);

    if (!release) {
      throw new Error(`Release ${version} for ${modName} was not found.`);
    }

    if (options.includeDependencies) {
      for (const dependency of release.dependencies.filter(
        isRequiredDownloadableDependency,
      )) {
        const dependencyMod = await dependencies.fetchModFull(dependency.name);
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
      targetFolder,
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
