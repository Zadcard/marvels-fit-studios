"use client";

import { useState, useTransition } from "react";

import { changeOwnPassword } from "@/app/actions/account-security";

const emptyPasswordForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export function RequiredPasswordChangeForm() {
  const [formState, setFormState] = useState(emptyPasswordForm);
  const [message, setMessage] = useState("");
  const [isSaving, startTransition] = useTransition();

  const updateField = (field: keyof typeof emptyPasswordForm, value: string) => {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
  };

  return (
    <div className="login-form-panel">
      <div className="login-form-header">
        <div className="auth-kicker">First sign-in / secure access</div>
        <h1 className="login-form-title">Change your password</h1>
        <p className="login-form-subtitle">
          Choose a private password before opening your dashboard.
        </p>
      </div>

      <div className="login-callout" role="status">
        This is required once for new accounts.
      </div>

      {message ? (
        <div className="login-error" role="alert">
          {message}
        </div>
      ) : null}

      <form
        className="login-form"
        onSubmit={(event) => {
          event.preventDefault();
          setMessage("");

          startTransition(async () => {
            try {
              await changeOwnPassword(formState);
              setFormState(emptyPasswordForm);
              window.location.href = "/auth/redirect";
            } catch (error) {
              setMessage(
                error instanceof Error
                  ? error.message
                  : "Could not update password."
              );
            }
          });
        }}
        noValidate
      >
        <div className="login-field-group">
          <label className="login-field-label" htmlFor="current-password">
            Current password
          </label>
          <input
            id="current-password"
            name="currentPassword"
            type="password"
            className="auth-field"
            value={formState.currentPassword}
            onChange={(event) =>
              updateField("currentPassword", event.target.value)
            }
            autoComplete="current-password"
            disabled={isSaving}
            required
          />
        </div>

        <div className="login-field-group">
          <label className="login-field-label" htmlFor="new-password">
            New password
          </label>
          <input
            id="new-password"
            name="newPassword"
            type="password"
            className="auth-field"
            value={formState.newPassword}
            onChange={(event) => updateField("newPassword", event.target.value)}
            autoComplete="new-password"
            disabled={isSaving}
            required
          />
        </div>

        <div className="login-field-group">
          <label className="login-field-label" htmlFor="confirm-password">
            Confirm new password
          </label>
          <input
            id="confirm-password"
            name="confirmPassword"
            type="password"
            className="auth-field"
            value={formState.confirmPassword}
            onChange={(event) =>
              updateField("confirmPassword", event.target.value)
            }
            autoComplete="new-password"
            disabled={isSaving}
            required
          />
        </div>

        <button
          type="submit"
          className="auth-primary-button login-submit"
          disabled={isSaving}
        >
          <span className="login-submit-content">
            {isSaving ? <span className="login-spinner" /> : null}
            {isSaving ? "Updating..." : "Update password"}
          </span>
        </button>
      </form>
    </div>
  );
}
