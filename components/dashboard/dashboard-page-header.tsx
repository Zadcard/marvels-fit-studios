type DashboardPageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
};

export function DashboardPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: DashboardPageHeaderProps) {
  return (
    <header className="dashboard-page-header">
      <div className="dashboard-page-header__content">
        <span className="mv-eyebrow">{eyebrow}</span>
        <h2 className="dashboard-page-header__title">{title}</h2>
        <p className="dashboard-page-header__description">{description}</p>
      </div>

      {actions ? (
        <div className="dashboard-page-header__actions">{actions}</div>
      ) : null}
    </header>
  );
}
