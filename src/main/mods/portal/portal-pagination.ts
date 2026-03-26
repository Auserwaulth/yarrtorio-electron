import { ModSummary, BrowsePagination } from "@shared/types/mod";

/**
 * Builds pagination metadata for a filtered mod list.
 *
 * The page number is clamped to the available range, and the page count always
 * reports at least one page so the UI can render a stable pager state.
 */
export function paginate(
  items: ModSummary[],
  page: number,
  pageSize: number,
): BrowsePagination {
  const count = items.length;
  const pageCount = Math.max(1, Math.ceil(count / pageSize));
  const safePage = Math.min(page, pageCount);
  return {
    count,
    page: safePage,
    pageCount,
    pageSize,
    hasNext: safePage < pageCount,
    hasPrev: safePage > 1,
  };
}
