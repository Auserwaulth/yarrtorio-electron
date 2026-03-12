import { ModSummary, ModPortalTab } from "@shared/types/mod";

export function compareByIsoDate(left?: string, right?: string): number {
  const leftValue = left ? Date.parse(left) : 0;
  const rightValue = right ? Date.parse(right) : 0;
  return rightValue - leftValue;
}

export function scoreSummary(mod: ModSummary, tab: ModPortalTab): number {
  const downloads = mod.downloadsCount ?? 0;
  const score = mod.score ?? 0;
  const updatedAt = mod.updatedAt ? Date.parse(mod.updatedAt) / 1000 : 0;
  const highlightedAt = mod.lastHighlightedAt
    ? Date.parse(mod.lastHighlightedAt) / 1000
    : 0;

  switch (tab) {
    case "most_downloaded":
      return downloads * 100 + score;
    case "highlighted":
      return highlightedAt + score * 1000 + downloads;
    case "trending":
      return score * 100000 + updatedAt + downloads;
    case "search":
      return score * 100000 + downloads * 10 + updatedAt;
    case "recently_updated":
    default:
      return updatedAt + score;
  }
}

export function sortSummaries(
  mods: ModSummary[],
  tab: ModPortalTab,
): ModSummary[] {
  return [...mods].sort((left, right) => {
    if (tab === "recently_updated") {
      const updatedDelta = compareByIsoDate(left.updatedAt, right.updatedAt);
      if (updatedDelta !== 0) return updatedDelta;
    }

    if (tab === "highlighted") {
      const highlightDelta = compareByIsoDate(
        left.lastHighlightedAt,
        right.lastHighlightedAt,
      );
      if (highlightDelta !== 0) return highlightDelta;
    }

    const scoreDelta = scoreSummary(right, tab) - scoreSummary(left, tab);
    if (scoreDelta !== 0) return scoreDelta;

    const downloadDelta =
      (right.downloadsCount ?? 0) - (left.downloadsCount ?? 0);
    if (downloadDelta !== 0) return downloadDelta;

    return left.title.localeCompare(right.title);
  });
}
