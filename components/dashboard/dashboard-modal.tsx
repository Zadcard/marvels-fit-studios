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

    const panel = panelRef.current;
    // Remember what had focus so it can be restored when the modal closes.
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const getFocusable = () =>
      Array.from(
        panel?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) ?? []
      );

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      // Trap focus inside the dialog (ARIA modal pattern).
      const focusable = getFocusable();
      if (focusable.length === 0) {
        event.preventDefault();
        panel?.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.body.classList.add("modal-open");
    document.addEventListener("keydown", handleKeyDown);
    panel?.focus();

    return () => {
      document.body.classList.remove("modal-open");
      document.removeEventListener("keydown", handleKeyDown);
      // Restore focus to the trigger so keyboard users keep their place.
      previouslyFocused?.focus?.();
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
