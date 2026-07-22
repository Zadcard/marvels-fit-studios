"use client";

import { type ReactNode } from "react";
import { Dialog } from "radix-ui";
import { Trash2, X } from "lucide-react";

import { cn } from "@/lib/utils";
import styles from "./entity-form.module.css";

type EntityDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  closeLabel: string;
  size?: "default" | "small" | "wide";
  children: ReactNode;
};

/** Standard create/edit dialog shell shared by entity-management editors (client, coach, ...). */
export function EntityDialog({
  open,
  onOpenChange,
  title,
  description,
  closeLabel,
  size = "default",
  children,
}: EntityDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={cn(styles.dialog, size === "small" && styles.dialogSmall, size === "wide" && styles.dialogWide)}>
          <Dialog.Title className={styles.title}>{title}</Dialog.Title>
          <Dialog.Description className={description ? styles.description : "sr-only"}>
            {description ?? "Create or update this record."}
          </Dialog.Description>
          <Dialog.Close className={styles.close} aria-label={closeLabel}>
            <X size={18} />
          </Dialog.Close>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

type FormFieldProps = {
  label: ReactNode;
  htmlFor?: string;
  required?: boolean;
  full?: boolean;
  className?: string;
  children: ReactNode;
};

/** Label + control wrapper with a consistent required indicator, used inside EntityForm grids. */
export function FormField({ label, htmlFor, required, full, className, children }: FormFieldProps) {
  return (
    <label className={cn(styles.field, full && styles.full, className)} htmlFor={htmlFor}>
      <span>
        {label}
        {required ? <span className={styles.required} aria-hidden="true"> *</span> : null}
      </span>
      {children}
    </label>
  );
}

export function EntityForm({ className, ...props }: React.FormHTMLAttributes<HTMLFormElement>) {
  return <form className={cn(styles.form, className)} {...props} />;
}

export function FormErrorBanner({ children }: { children: ReactNode }) {
  return (
    <p className={styles.error} role="alert">
      {children}
    </p>
  );
}

type FormActionsProps = {
  onCancel: () => void;
  onDelete?: () => void;
  deleteLabel?: string;
  submitLabel: string;
  pendingLabel?: string;
  pending?: boolean;
  disabled?: boolean;
};

/** Standard Delete / Cancel / Save row for entity editor forms. */
export function FormActions({
  onCancel,
  onDelete,
  deleteLabel = "Delete",
  submitLabel,
  pendingLabel,
  pending,
  disabled,
}: FormActionsProps) {
  return (
    <div className={styles.actions}>
      {onDelete ? (
        <button type="button" className={styles.deleteButton} onClick={onDelete} disabled={pending}>
          <Trash2 size={16} /> {deleteLabel}
        </button>
      ) : (
        <span />
      )}
      <button type="button" className="mv-btn mv-btn-secondary" onClick={onCancel}>
        Cancel
      </button>
      <button type="submit" className="mv-btn mv-btn-primary" disabled={pending || disabled}>
        {pending && pendingLabel ? pendingLabel : submitLabel}
      </button>
    </div>
  );
}

type ConfirmDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmationValue: string;
  onConfirmationChange: (value: string) => void;
  confirmWord?: string;
  error?: string;
  pending?: boolean;
  onConfirm: () => void;
  closeLabel: string;
};

/** Standard "type the word to confirm" destructive-action dialog shared across entity editors. */
export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmationValue,
  onConfirmationChange,
  confirmWord = "Delete",
  error,
  pending,
  onConfirm,
  closeLabel,
}: ConfirmDeleteDialogProps) {
  return (
    <EntityDialog open={open} onOpenChange={onOpenChange} title={title} closeLabel={closeLabel} size="small">
      <div className={styles.confirmBody}>
        <Trash2 size={25} />
        <p>{description}</p>
        <label>
          Confirmation
          <input
            value={confirmationValue}
            onChange={(event) => onConfirmationChange(event.target.value)}
            placeholder={confirmWord}
          />
        </label>
        {error ? <FormErrorBanner>{error}</FormErrorBanner> : null}
        <div className={styles.confirmActions}>
          <button type="button" className="mv-btn mv-btn-secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.deleteButton}
            disabled={confirmationValue !== confirmWord || pending}
            onClick={onConfirm}
          >
            Delete permanently
          </button>
        </div>
      </div>
    </EntityDialog>
  );
}
