import {
  ModCategory,
  ModDependency,
  ModDetails,
  ModSummary,
  ModTag,
} from "@shared/types/mod";
import { cleanPortalValue } from "./portal-html";
import { firstDefined } from "./portal-utils";
import { ApiMod, ApiRelease } from "./portal-types";

const NON_DOWNLOADABLE_DEPENDENCIES = new Map<string, string>([
  ["base", "Built into Factorio."],
  ["core", "Built into Factorio."],
  ["freeplay", "Built into Factorio."],
  ["quality", "Official expansion content."],
  ["space-age", "Official expansion content."],
  ["elevated-rails", "Official expansion content."],
]);

export function parseDependency(raw: string): ModDependency | null {
  const value = raw.trim();
  if (!value) return null;

  let kind: ModDependency["kind"] = "required";
  let body = value;

  if (body.startsWith("(?)")) {
    kind = "hidden-optional";
    body = body.slice(3).trim();
  } else if (body.startsWith("?")) {
    kind = "optional";
    body = body.slice(1).trim();
  } else if (body.startsWith("!")) {
    kind = "incompatible";
    body = body.slice(1).trim();
  } else if (body.startsWith("~")) {
    body = body.slice(1).trim();
  }

  body = body.replace(/^\(+|\)+$/g, "").trim();

  const match = body.match(/^([A-Za-z0-9_.-]+)(?:\s*(.*))?$/);
  if (!match) {
    return {
      raw: value,
      name: body,
      kind,
      downloadable: false,
      reasonSkipped: "Unrecognized dependency format.",
    };
  }

  const name = match[1] as string;
  const versionConstraint = match[2]?.trim() || undefined;
  const skippedReason = NON_DOWNLOADABLE_DEPENDENCIES.get(name);

  return {
    raw: value,
    name,
    kind,
    versionConstraint: versionConstraint,
    downloadable: !skippedReason,
    reasonSkipped: skippedReason,
  };
}

export function mapRelease(release: ApiRelease) {
  return {
    version: release.version,
    ...(release.info_json?.factorio_version
      ? { factorioVersion: release.info_json.factorio_version }
      : {}),
    releasedAt: release.released_at,
    downloadPath: release.download_url,
    fileName: release.file_name,
    dependencies: (release.info_json?.dependencies ?? [])
      .map(parseDependency)
      .filter((value): value is ModDependency => value !== null),
  };
}

function toAbsoluteAssetUrl(path?: string): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `https://assets-mod.factorio.com${path}`;
}

export function toAbsoluteThumbnailUrl(thumbnail?: string): string | undefined {
  return toAbsoluteAssetUrl(thumbnail);
}

function normalizeCategory(category?: string): ModCategory | undefined {
  if (!category) return undefined;
  const normalized = category.toLowerCase() as ModCategory;
  return normalized;
}

function normalizeTags(tags?: string[]): ModTag[] {
  if (!tags) return [];
  return tags.map((tag) => tag.toLowerCase() as ModTag);
}

export function mapSummary(mod: ApiMod): ModSummary {
  const thumbnail = toAbsoluteThumbnailUrl(mod.thumbnail);
  const latestRelease = mod.latest_release
    ? mapRelease(mod.latest_release)
    : undefined;
  const category = normalizeCategory(mod.category);

  return {
    name: mod.name,
    title: mod.title,
    summary: mod.summary ?? "",
    owner: mod.owner ?? "unknown",
    ...(category ? { category } : {}),
    tags: normalizeTags(mod.tags),
    ...(mod.downloads_count !== undefined
      ? { downloadsCount: mod.downloads_count }
      : {}),
    ...(mod.score !== undefined ? { score: mod.score } : {}),
    ...(thumbnail !== undefined ? { thumbnail } : {}),
    ...(mod.updated_at ? { updatedAt: mod.updated_at } : {}),
    ...(mod.last_highlighted_at
      ? { lastHighlightedAt: mod.last_highlighted_at }
      : {}),
    ...(latestRelease !== undefined ? { latestRelease } : {}),
  };
}

export function mapLicense(
  mod: ApiMod,
): Pick<ModDetails, "licenseName" | "licenseUrl"> {
  const license = mod.license;

  if (typeof license === "string") {
    const licenseName = cleanPortalValue(license);
    return licenseName ? { licenseName } : {};
  }

  if (!license) {
    return {};
  }

  const licenseName = cleanPortalValue(
    firstDefined(license.name, license.title, license.id),
  );
  const licenseUrl = cleanPortalValue(firstDefined(license.url, license.link));

  return {
    ...(licenseName ? { licenseName } : {}),
    ...(licenseUrl ? { licenseUrl } : {}),
  };
}
