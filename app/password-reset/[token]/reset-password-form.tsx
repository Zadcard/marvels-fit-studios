"use client";

import { useActionState } from "react";
import Link from "next/link";

import { resetPasswordWithToken } from "@/app/actions/password-reset";
import { initialPasswordResetState } from "@/app/actions/password-reset-state";

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) {
    return null;
  }

  return (
    <div className="login-field-error" role="alert">
      {errors[0]}
    </div>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(
    resetPasswordWithToken,
    initialPasswordResetState
  );

  return (
    <div className="login-form-panel">
      <div className="login-form-header">
        <div className="mv-eyebrow">New Password</div>
        <h1 className="login-form-title">Choose a new password</h1>
        <p className="login-form-subtitle">
          Use at least 8 characters with letters and numbers.
        </p>
      </div>

      {state.status === "success" ? (
        <div className="login-callout" role="status">
          {state.message}
        </div>
      ) : null}

      {state.status === "error" && state.message ? (
        <div className="login-error" role="alert">
          {state.message}
        </div>
      ) : null}

      <form className="login-form" action={action} noValidate>
        <input type="hidden" name="token" value={token} />

        <div className="login-field-group">
          <label className="login-field-label" htmlFor="new-password">
            New password
          </label>
          <input
            id="new-password"
            name="newPassword"
            type="password"
            className={`mv-field ${
              state.fieldErrors?.newPassword ? "field-error" : ""
            }`}
            autoComplete="new-password"
            aria-invalid={state.fieldErrors?.newPassword ? "true" : undefined}
            disabled={pending}
            required
          />
          <FieldError errors={state.fieldErrors?.newPassword} />
        </div>

        <div className="login-field-group">
          <label className="login-field-label" htmlFor="confirm-password">
            Confirm password
          </label>
          <input
            id="confirm-password"
            name="confirmPassword"
            type="password"
            className={`mv-field ${
              state.fieldErrors?.confirmPassword ? "field-error" : ""
            }`}
            autoComplete="new-password"
            aria-invalid={
              state.fieldErrors?.confirmPassword ? "true" : undefined
            }
            disabled={pending}
            required
          />
          <FieldError errors={state.fieldErrors?.confirmPassword} />
        </div>

        <button
          type="submit"
          className="mv-btn mv-btn-primary login-submit"
          disabled={pending}
        >
          <span className="login-submit-content">
            {pending ? <span className="login-spinner" /> : null}
            {pending ? "Updating..." : "Update password"}
          </span>
        </button>
      </form>

      <Link href="/login" className="login-back">
        Back to sign in
      </Link>
    </div>
  );
}
