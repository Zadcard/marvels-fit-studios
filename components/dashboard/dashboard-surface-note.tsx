type DashboardSurfaceNoteProps = {
  eyebrow: string;
  title: string;
  description: string;
  tone?: "accent" | "neutral" | "success";
  items?: string[];
  action?: React.ReactNode;
};

export function DashboardSurfaceNote({
  eyebrow,
  title,
  description,
  tone = "accent",
  items,
  action,
}: DashboardSurfaceNoteProps) {
  return (
    <section className={`dashboard-surface-note dashboard-surface-note--${tone}`}>
      <div className="dashboard-surface-note__header">
        <div>
          <span className="mv-eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        {action ? <div className="dashboard-surface-note__action">{action}</div> : null}
      </div>

      {items?.length ? (
        <ul className="dashboard-surface-note__list">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
