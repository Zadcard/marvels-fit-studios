"use client";

import { useActionState } from "react";
import Link from "next/link";

import { requestPasswordReset } from "@/app/actions/password-reset";
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

export function PasswordResetRequestForm() {
  const [state, action, pending] = useActionState(
    requestPasswordReset,
    initialPasswordResetState
  );

  return (
    <div className="login-form-panel">
      <div className="login-form-header">
        <div className="mv-eyebrow">Password Reset</div>
        <h1 className="login-form-title">Reset your password</h1>
        <p className="login-form-subtitle">
          Enter your 7-digit Client ID. The studio will handle reset
          instructions out of band.
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
        <div className="login-field-group">
          <label className="login-field-label" htmlFor="reset-client-id">
            Client ID
          </label>
          <input
            id="reset-client-id"
            name="clientId"
            type="text"
            className={`mv-field ${
              state.fieldErrors?.clientId ? "field-error" : ""
            }`}
            placeholder="2605020"
            inputMode="numeric"
            maxLength={7}
            autoComplete="off"
            aria-invalid={state.fieldErrors?.clientId ? "true" : undefined}
            disabled={pending}
            required
          />
          <FieldError errors={state.fieldErrors?.clientId} />
        </div>

        <button
          type="submit"
          className="mv-btn mv-btn-primary login-submit"
          disabled={pending}
        >
          <span className="login-submit-content">
            {pending ? <span className="login-spinner" /> : null}
            {pending ? "Sending..." : "Request reset"}
          </span>
        </button>
      </form>

      <Link href="/login" className="login-back">
        Back to sign in
      </Link>
    </div>
  );
}
