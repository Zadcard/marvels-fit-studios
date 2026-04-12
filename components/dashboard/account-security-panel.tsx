"use client";

import { useState, useTransition } from "react";
import { KeyRound } from "lucide-react";

import { changeOwnPassword } from "@/app/actions/account-security";

const emptyPasswordForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export function AccountSecurityPanel() {
  const [formState, setFormState] = useState(emptyPasswordForm);
  const [message, setMessage] = useState("Use a strong password you do not reuse.");
  const [isSaving, startTransition] = useTransition();

  const updateField = (field: keyof typeof emptyPasswordForm, value: string) => {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
  };

  return (
    <article className="dashboard-panel">
      <div className="dashboard-panel__header">
        <div>
          <span className="mv-eyebrow">Security</span>
          <h2>Change password</h2>
          <p>{message}</p>
        </div>
        <KeyRound size={20} color="#ff8b8f" />
      </div>

      <div className="dashboard-form-columns">
        <label className="dashboard-form-field">
          <span>Current password</span>
          <input
            className="dashboard-input"
            type="password"
            value={formState.currentPassword}
            onChange={(event) => updateField("currentPassword", event.target.value)}
            autoComplete="current-password"
          />
        </label>
        <label className="dashboard-form-field">
          <span>New password</span>
          <input
            className="dashboard-input"
            type="password"
            value={formState.newPassword}
            onChange={(event) => updateField("newPassword", event.target.value)}
            autoComplete="new-password"
          />
        </label>
        <label className="dashboard-form-field">
          <span>Confirm new password</span>
          <input
            className="dashboard-input"
            type="password"
            value={formState.confirmPassword}
            onChange={(event) => updateField("confirmPassword", event.target.value)}
            autoComplete="new-password"
          />
        </label>
      </div>

      <div className="dashboard-row-actions">
        <button
          type="button"
          className="mv-btn mv-btn-primary"
          disabled={isSaving}
          onClick={() =>
            startTransition(async () => {
              try {
                await changeOwnPassword(formState);
                setFormState(emptyPasswordForm);
                setMessage("Password updated.");
              } catch (error) {
                setMessage(
                  error instanceof Error ? error.message : "Could not update password."
                );
              }
            })
          }
        >
          {isSaving ? "Updating..." : "Update password"}
        </button>
      </div>
    </article>
  );
}
