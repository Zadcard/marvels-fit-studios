export const DASHBOARD_DEFAULT_PAGE_SIZE = 10;

export type DashboardPaginationState<T> = {
  items: T[];
  totalItems: number;
  page: number;
  pageSize: number;
  pageCount: number;
  startItem: number;
  endItem: number;
};

export function clampDashboardPage(page: number, totalItems: number, pageSize: number) {
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));
  return Math.min(Math.max(page, 1), pageCount);
}

export function paginateDashboardItems<T>(
  items: T[],
  page: number,
  pageSize = DASHBOARD_DEFAULT_PAGE_SIZE
): DashboardPaginationState<T> {
  const totalItems = items.length;
  const safePageSize = Math.max(1, pageSize);
  const safePage = clampDashboardPage(page, totalItems, safePageSize);
  const startIndex = (safePage - 1) * safePageSize;
  const endIndex = Math.min(startIndex + safePageSize, totalItems);

  return {
    items: items.slice(startIndex, endIndex),
    totalItems,
    page: safePage,
    pageSize: safePageSize,
    pageCount: Math.max(1, Math.ceil(totalItems / safePageSize)),
    startItem: totalItems === 0 ? 0 : startIndex + 1,
    endItem: endIndex,
  };
}
