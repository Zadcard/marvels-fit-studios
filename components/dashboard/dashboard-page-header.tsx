type DashboardPageHeaderProps = {
  eyebrow?: string;
  actions?: React.ReactNode;
};

export function DashboardPageHeader({
  eyebrow,
  actions,
}: DashboardPageHeaderProps) {
  if (!eyebrow && !actions) {
    return null;
  }

  return (
    <header className="dashboard-page-header">
      {eyebrow ? <span className="dashboard-page-header__eyebrow">{eyebrow}</span> : null}

      {actions ? (
        <div className="dashboard-page-header__actions">{actions}</div>
      ) : null}
    </header>
  );
}
