type DashboardEmptyStateProps = {
  title: string;
  description: string;
};

export function DashboardEmptyState({
  title,
  description,
}: DashboardEmptyStateProps) {
  return (
    <div className="dashboard-empty-state" role="status" aria-live="polite">
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}
