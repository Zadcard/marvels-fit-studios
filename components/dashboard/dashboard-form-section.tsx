type DashboardFormSectionProps = {
  eyebrow?: string;
  title: string;
  description: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
};

export function DashboardFormSection({
  eyebrow,
  title,
  description,
  children,
  actions,
}: DashboardFormSectionProps) {
  return (
    <section className="dashboard-form-section">
      <div className="dashboard-form-section__header">
        <div>
          {eyebrow ? <span className="mv-eyebrow">{eyebrow}</span> : null}
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        {actions ? (
          <div className="dashboard-form-section__actions">{actions}</div>
        ) : null}
      </div>

      <div className="dashboard-form-section__body">{children}</div>
    </section>
  );
}
