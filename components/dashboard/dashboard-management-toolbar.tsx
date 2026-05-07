import {
  useEffect,
  useId,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { Search } from "lucide-react";

export type DashboardSearchSuggestion = {
  label: string;
  value?: string;
  detail?: string;
};

type DashboardManagementToolbarProps = {
  searchValue: string;
  searchPlaceholder: string;
  onSearchChange: (value: string) => void;
  searchSuggestions?: DashboardSearchSuggestion[];
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
  searchSuggestions = [],
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
  const searchInputId = useId();
  const [searchDraft, setSearchDraft] = useState(searchValue);

  useEffect(() => {
    setSearchDraft(searchValue);
  }, [searchValue]);

  const visibleSuggestions = useMemo(() => {
    const query = searchDraft.trim().toLowerCase();

    if (!query) {
      return [];
    }

    return searchSuggestions
      .filter((suggestion) =>
        [suggestion.label, suggestion.value, suggestion.detail]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query)
      )
      .slice(0, 6);
  }, [searchDraft, searchSuggestions]);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearchChange(searchDraft.trim());
  };

  const handleSuggestionSelect = (value: string) => {
    setSearchDraft(value);
    onSearchChange(value);
  };

  return (
    <div className="dashboard-toolbar">
      <div className="dashboard-toolbar__main">
        <form className="dashboard-search-field" onSubmit={handleSearchSubmit}>
          <label className="dashboard-search-field__label" htmlFor={searchInputId}>
            {searchLabel}
          </label>
          <div className="dashboard-search-field__controls">
            <input
              id={searchInputId}
              type="search"
              name="dashboard-search"
              autoComplete="off"
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder={searchPlaceholder}
              className="dashboard-input"
            />
            <button type="submit" className="mv-btn mv-btn-primary">
              <Search size={16} />
              Search
            </button>
          </div>
          {visibleSuggestions.length > 0 ? (
            <div className="dashboard-search-suggestions" role="listbox">
              {visibleSuggestions.map((suggestion) => {
                const value = suggestion.value ?? suggestion.label;

                return (
                  <button
                    key={`${suggestion.label}-${value}`}
                    type="button"
                    className="dashboard-search-suggestion"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSuggestionSelect(value)}
                  >
                    <strong>{suggestion.label}</strong>
                    {suggestion.detail ? <span>{suggestion.detail}</span> : null}
                  </button>
                );
              })}
            </div>
          ) : null}
        </form>
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
