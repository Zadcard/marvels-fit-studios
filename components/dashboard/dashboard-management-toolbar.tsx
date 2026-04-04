type DashboardManagementToolbarProps = {
  searchValue: string;
  searchPlaceholder: string;
  onSearchChange: (value: string) => void;
  summary: string;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
};

export function DashboardManagementToolbar({
  searchValue,
  searchPlaceholder,
  onSearchChange,
  summary,
  filters,
  actions,
}: DashboardManagementToolbarProps) {
  return (
    <div className="dashboard-toolbar">
      <div className="dashboard-toolbar__main">
        <label className="dashboard-search-field">
          <span className="dashboard-search-field__label">Search</span>
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
        {filters ? <div className="dashboard-toolbar__filters">{filters}</div> : null}
      </div>

      <div className="dashboard-toolbar__side">
        <p className="dashboard-toolbar__summary">{summary}</p>
        {actions ? <div className="dashboard-toolbar__actions">{actions}</div> : null}
      </div>
    </div>
  );
}
