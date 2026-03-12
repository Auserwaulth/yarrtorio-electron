import { ModSummary, BrowsePagination } from "@shared/types/mod";

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
