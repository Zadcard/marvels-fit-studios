type DashboardManagementToolbarProps = {
  searchValue: string;
  searchPlaceholder: string;
  onSearchChange: (value: string) => void;
  summary: string;
  searchLabel?: string;
  sortLabel?: string;
  sortValue?: string;
  sortOptions?: Array<{ label: string; value: string }>;
  onSortChange?: (value: string) => void;
  isFiltered?: boolean;
  onReset?: () => void;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
};

export function DashboardManagementToolbar({
  searchValue,
  searchPlaceholder,
  onSearchChange,
  summary,
  searchLabel = "Search",
  sortLabel = "Sort",
  sortValue,
  sortOptions,
  onSortChange,
  isFiltered = false,
  onReset,
  filters,
  actions,
}: DashboardManagementToolbarProps) {
  return (
    <div className="dashboard-toolbar">
      <div className="dashboard-toolbar__main">
        <label className="dashboard-search-field">
          <span className="dashboard-search-field__label">{searchLabel}</span>
          <input
            type="search"
            name="dashboard-search"
            autoComplete="off"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="dashboard-input"
          />
        </label>
        {sortOptions && sortValue !== undefined && onSortChange ? (
          <label className="dashboard-filter-field dashboard-filter-field--sort">
            <span>{sortLabel}</span>
            <select
              className="dashboard-select"
              value={sortValue}
              onChange={(event) => onSortChange(event.target.value)}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {filters ? <div className="dashboard-toolbar__filters">{filters}</div> : null}
      </div>

      <div className="dashboard-toolbar__side">
        <p className="dashboard-toolbar__summary">{summary}</p>
        {actions || (isFiltered && onReset) ? (
          <div className="dashboard-toolbar__actions">
            {isFiltered && onReset ? (
              <button
                type="button"
                className="dashboard-inline-button"
                onClick={onReset}
              >
                Reset
              </button>
            ) : null}
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );
}
