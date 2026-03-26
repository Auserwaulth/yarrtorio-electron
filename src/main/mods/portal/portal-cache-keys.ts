import { FactorioVersion } from "@shared/types/mod";

/** Browse datasets stay warm for a short period because filters change often. */
export const DATASET_TTL_MS = 1000 * 60 * 20;
/** Mod details stay cached longer because they are revisited less frequently. */
export const DETAILS_TTL_MS = 1000 * 60 * 60;

/**
 * Builds the cache key for a browse dataset request.
 *
 * The `includeDeprecated` flag changes the payload shape, so it is part of the
 * key rather than being inferred from the version alone.
 */
export function buildDatasetCacheKey(
  version: FactorioVersion,
  includeDeprecated: boolean,
): string {
  return `browse-dataset:${version}:${includeDeprecated ? "all" : "active"}`;
}

/** Builds the cache key for a single mod details request. */
export function buildDetailsCacheKey(modName: string): string {
  return `mod-details:${modName}`;
}
