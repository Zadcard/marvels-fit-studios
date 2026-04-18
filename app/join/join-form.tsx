"use client";

import { useActionState } from "react";
import Link from "next/link";

import { registerClientWithAutoCredentials } from "@/app/actions/landing";
import {
  initialJoinNowState,
  type JoinNowActionState,
} from "@/app/actions/join-now-types";

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

export function JoinForm() {
  const [state, action, pending] = useActionState<
    JoinNowActionState,
    FormData
  >(registerClientWithAutoCredentials, initialJoinNowState);

  return (
    <div className="login-form-panel">
      <div className="login-form-header">
        <div className="mv-eyebrow">Join Marvel Fitness</div>
        <h1 className="login-form-title">Create your client account</h1>
        <p className="login-form-subtitle">
          Enter your name and phone number. Your Client ID and password are
          generated instantly.
        </p>
      </div>

      {state.status === "success" && state.credentials ? (
        <div className="login-callout" role="alert">
          <strong>Save these credentials!</strong>
          <br />
          Client ID: {state.credentials.clientId}
          <br />
          Password: {state.credentials.password}
        </div>
      ) : null}

      {state.status === "error" && state.message ? (
        <div className="login-error" role="alert">
          {state.message}
        </div>
      ) : null}

      <form className="login-form" action={action} noValidate>
        <div className="login-field-group">
          <label className="login-field-label" htmlFor="join-full-name">
            Full name
          </label>
          <input
            id="join-full-name"
            className={`mv-field ${
              state.fieldErrors?.fullName ? "field-error" : ""
            }`}
            name="fullName"
            type="text"
            placeholder="Enter your full name"
            autoComplete="name"
            aria-invalid={state.fieldErrors?.fullName ? "true" : undefined}
            disabled={pending}
            required
          />
          <FieldError errors={state.fieldErrors?.fullName} />
        </div>

        <div className="login-field-group">
          <label className="login-field-label" htmlFor="join-phone">
            Phone number
          </label>
          <input
            id="join-phone"
            className={`mv-field ${
              state.fieldErrors?.phone ? "field-error" : ""
            }`}
            name="phone"
            type="tel"
            placeholder="+20 1XX XXX XXXX"
            autoComplete="tel"
            inputMode="tel"
            aria-invalid={state.fieldErrors?.phone ? "true" : undefined}
            disabled={pending}
            required
          />
          <FieldError errors={state.fieldErrors?.phone} />
        </div>

        <button
          type="submit"
          className="mv-btn mv-btn-primary login-submit"
          disabled={pending}
        >
          <span className="login-submit-content">
            {pending ? <span className="login-spinner" /> : null}
            {pending ? "Creating account..." : "Create account"}
          </span>
        </button>
      </form>

      <Link href="/login" className="login-back">
        Already have credentials? Sign in
      </Link>
    </div>
  );
}
