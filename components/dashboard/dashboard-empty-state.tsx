type DashboardEmptyStateProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function DashboardEmptyState({
  title,
  description,
  action,
}: DashboardEmptyStateProps) {
  return (
    <div className="dashboard-empty-state" role="status" aria-live="polite">
      <strong>{title}</strong>
      <p>{description}</p>
      {action ? <div className="dashboard-empty-state__action">{action}</div> : null}
    </div>
  );
}
