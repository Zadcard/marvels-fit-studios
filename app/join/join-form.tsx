"use client";

import { useActionState } from "react";
import Link from "next/link";

import { submitJoinNowLead } from "@/app/actions/landing";
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
  >(submitJoinNowLead, initialJoinNowState);

  return (
    <div className="login-form-panel">
      <div className="login-form-header">
        <div className="mv-eyebrow">Join Marvel Fitness</div>
        <h1 className="login-form-title">Start your membership request</h1>
        <p className="login-form-subtitle">
          Enter your name and phone number. An admin will approve your lead
          before your Client ID and temporary password are created.
        </p>
      </div>

      {state.status === "success" && state.credentials ? (
        <div className="join-credentials-screen" role="alert">
          <div className="join-credentials-screen__header">
            <div className="mv-eyebrow">Your Account Details</div>
            <h2 className="login-form-title">Save these login details</h2>
          </div>

          <div className="join-credentials-screen__stack">
            <div className="join-credentials-screen__card">
              <span>Client ID</span>
              <strong>{state.credentials.clientId}</strong>
            </div>
            <div className="join-credentials-screen__card">
              <span>Password</span>
              <strong>{state.credentials.password}</strong>
            </div>
          </div>

          <p className="join-credentials-screen__note">
            Someone from the studio team will accept your request.
          </p>
          <p className="join-credentials-screen__note">
            *Note: when logging in the password must be changed by a strong password.
          </p>
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
              state.fieldErrors?.name ? "field-error" : ""
            }`}
            name="name"
            type="text"
            placeholder="Enter your full name"
            autoComplete="name"
            aria-invalid={state.fieldErrors?.name ? "true" : undefined}
            disabled={pending}
            required
          />
          <FieldError errors={state.fieldErrors?.name} />
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
            {pending ? "Submitting request..." : "Submit request"}
          </span>
        </button>
      </form>

      <Link href="/login" className="login-back">
        Already have credentials? Sign in
      </Link>
    </div>
  );
}
