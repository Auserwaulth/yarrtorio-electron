import { readCache, writeCache } from "./mod-cache";
import { applyBrowseFilters } from "./portal/portal-filters";
import { sortSummaries } from "./portal/portal-sort";
import { paginate } from "./portal/portal-pagination";
import {
  buildDatasetCacheKey,
  buildDetailsCacheKey,
  DATASET_TTL_MS,
  DETAILS_TTL_MS,
} from "./portal/portal-cache-keys";
import {
  fetchBrowseDatasetFromApi,
  fetchModFull,
  fetchPortalExtras,
} from "./portal/portal-api";
import {
  mapLicense,
  mapRelease,
  mapSummary,
  toAbsoluteThumbnailUrl,
} from "./portal/portal-mappers";
import { cleanPortalValue } from "./portal/portal-html";
import { firstDefined } from "./portal/portal-utils";
import type {
  BrowseFilters,
  BrowseResult,
  ModDetails,
  ModSummary,
} from "@shared/types/mod";
import type { PortalDetailsExtras } from "./portal/portal-types";

async function fetchBrowseDataset(
  version: BrowseFilters["version"],
  includeDeprecated: boolean,
): Promise<ModSummary[]> {
  const cacheKey = buildDatasetCacheKey(version, includeDeprecated);
  const cached = await readCache<ModSummary[]>(cacheKey);

  if (cached) {
    return cached;
  }

  const items = await fetchBrowseDatasetFromApi(version, includeDeprecated);
  await writeCache(cacheKey, items, DATASET_TTL_MS);

  return items;
}

export async function browseMods(
  filters: BrowseFilters,
): Promise<BrowseResult> {
  const dataset = await fetchBrowseDataset(
    filters.version,
    filters.includeDeprecated,
  );

  const filtered = applyBrowseFilters(dataset, filters);
  const sorted = sortSummaries(filtered, filters.tab);
  const pagination = paginate(sorted, filters.page, filters.pageSize);
  const start = (pagination.page - 1) * pagination.pageSize;

  return {
    items: sorted.slice(start, start + pagination.pageSize),
    pagination,
  };
}

export async function getModDetails(modName: string): Promise<ModDetails> {
  const cacheKey = buildDetailsCacheKey(modName);
  const cached = await readCache<ModDetails>(cacheKey);

  if (cached) {
    return cached;
  }

  const [mod, portalExtras] = await Promise.all([
    fetchModFull(modName),
    fetchPortalExtras(modName).catch(
      (): PortalDetailsExtras => ({
        images: [],
      }),
    ),
  ]);

  const apiLicense = mapLicense(mod);
  const sourceUrl = cleanPortalValue(mod.source_url);
  const homepageUrl = cleanPortalValue(
    firstDefined(mod.homepage_url, mod.homepage),
  );

  const images = Array.from(
    new Set(
      [
        ...(mod.thumbnail ? [toAbsoluteThumbnailUrl(mod.thumbnail)] : []),
        ...portalExtras.images,
      ].filter((value): value is string => Boolean(value)),
    ),
  );

  const resolvedSourceUrl = firstDefined(sourceUrl, portalExtras.sourceUrl);
  const resolvedHomepageUrl = firstDefined(
    homepageUrl,
    portalExtras.homepageUrl,
  );
  const resolvedLicenseName = firstDefined(
    apiLicense.licenseName,
    portalExtras.licenseName,
  );
  const resolvedLicenseUrl = firstDefined(
    apiLicense.licenseUrl,
    portalExtras.licenseUrl,
  );

  const details: ModDetails = {
    ...mapSummary(mod),
    description: mod.description ?? "",
    releases: (mod.releases ?? []).map(mapRelease).reverse(),
    ...(resolvedSourceUrl !== undefined
      ? { sourceUrl: resolvedSourceUrl }
      : {}),
    ...(resolvedHomepageUrl !== undefined
      ? { homepageUrl: resolvedHomepageUrl }
      : {}),
    ...(resolvedLicenseName !== undefined
      ? { licenseName: resolvedLicenseName }
      : {}),
    ...(resolvedLicenseUrl !== undefined
      ? { licenseUrl: resolvedLicenseUrl }
      : {}),
    ...(images.length > 0 ? { images } : {}),
  };

  await writeCache(cacheKey, details, DETAILS_TTL_MS);

  return details;
}
