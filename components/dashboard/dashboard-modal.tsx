import { useEffect, useId, useRef } from "react";

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
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.classList.add("modal-open");
    document.addEventListener("keydown", handleEscape);
    panelRef.current?.focus();

    return () => {
      document.body.classList.remove("modal-open");
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="dashboard-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <button
        type="button"
        aria-label="Close dialog"
        className="dashboard-modal__backdrop"
        onClick={onClose}
      />
      <div
        className={`dashboard-modal__panel dashboard-modal__panel--${size}`}
        ref={panelRef}
        tabIndex={-1}
      >
        <div className="dashboard-modal__header">
          <div>
            <span className="mv-eyebrow">Admin workspace</span>
            <h2 id={titleId}>{title}</h2>
            <p id={descriptionId}>{description}</p>
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
