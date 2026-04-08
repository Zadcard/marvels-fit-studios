import { useEffect, useId, useRef } from "react";

type DashboardModalProps = {
  open: boolean;
  title: string;
  description?: string;
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
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseRef.current();
      }
    };

    document.body.classList.add("modal-open");
    document.addEventListener("keydown", handleEscape);
    panelRef.current?.focus();

    return () => {
      document.body.classList.remove("modal-open");
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="dashboard-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
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
            <h2 id={titleId}>{title}</h2>
            {description ? <p id={descriptionId}>{description}</p> : null}
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
