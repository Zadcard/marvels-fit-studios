type DashboardModalProps = {
  open: boolean;
  title: string;
  description: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "default" | "wide";
};

export function DashboardModal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  size = "default",
}: DashboardModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="dashboard-modal" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close dialog"
        className="dashboard-modal__backdrop"
        onClick={onClose}
      />
      <div
        className={`dashboard-modal__panel dashboard-modal__panel--${size}`}
      >
        <div className="dashboard-modal__header">
          <div>
            <span className="mv-eyebrow">Admin workspace</span>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
          <button
            type="button"
            className="dashboard-modal__close"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="dashboard-modal__body">{children}</div>
        {footer ? <div className="dashboard-modal__footer">{footer}</div> : null}
      </div>
    </div>
  );
}
