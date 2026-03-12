import { FactorioVersion } from "@shared/types/mod";

export const DATASET_TTL_MS = 1000 * 60 * 20;
export const DETAILS_TTL_MS = 1000 * 60 * 60;

export function buildDatasetCacheKey(
  version: FactorioVersion,
  includeDeprecated: boolean,
): string {
  return `browse-dataset:${version}:${includeDeprecated ? "all" : "active"}`;
}

export function buildDetailsCacheKey(modName: string): string {
  return `mod-details:${modName}`;
}
