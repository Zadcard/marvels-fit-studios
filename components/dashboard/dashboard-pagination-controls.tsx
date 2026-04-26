type DashboardPaginationControlsProps = {
  page: number;
  pageCount: number;
  startItem: number;
  endItem: number;
  totalItems: number;
  onPageChange: (page: number) => void;
};

export function DashboardPaginationControls({
  page,
  pageCount,
  startItem,
  endItem,
  totalItems,
  onPageChange,
}: DashboardPaginationControlsProps) {
  if (totalItems <= 0) {
    return null;
  }

  return (
    <div className="dashboard-pagination" aria-label="Pagination">
      <p className="dashboard-pagination__summary">
        Showing {startItem}-{endItem} of {totalItems}
      </p>
      <div className="dashboard-pagination__controls">
        <button
          type="button"
          className="dashboard-inline-button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          Previous
        </button>
        <span className="dashboard-pagination__page">
          Page {page} of {pageCount}
        </span>
        <button
          type="button"
          className="dashboard-inline-button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
        >
          Next
        </button>
      </div>
    </div>
  );
}
