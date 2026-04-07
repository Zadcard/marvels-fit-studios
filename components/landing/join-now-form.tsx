"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";

import { submitJoinNowLead } from "@/app/actions/landing";
import { initialJoinNowState } from "@/app/actions/join-now-types";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="btn btn-primary btn-submit"
      id="join-submit"
      type="submit"
      aria-busy={pending}
      disabled={pending}
    >
      {pending ? "Sending request..." : "Submit"}
    </button>
  );
}

type FieldErrorProps = {
  errors?: string[];
};

function FieldError({ errors }: FieldErrorProps) {
  if (!errors?.length) {
    return null;
  }

  return <span className="field-error-text">{errors[0]}</span>;
}

export function JoinNowForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(
    submitJoinNowLead,
    initialJoinNowState
  );

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <form
      ref={formRef}
      id="joinNowForm"
      className="contact-form"
      action={formAction}
      noValidate
    >
      <div className="field-grid">
        <label>
          <span>Full name</span>
          <input
            className="field"
            id="cf-name"
            name="name"
            type="text"
            placeholder="Enter your full name"
            autoComplete="name"
            aria-invalid={state.fieldErrors?.name ? "true" : undefined}
            required
          />
          <FieldError errors={state.fieldErrors?.name} />
        </label>
        <label>
          <span>Phone number</span>
          <input
            className="field"
            id="cf-phone"
            name="phone"
            type="tel"
            placeholder="+20 1XX XXX XXXX"
            autoComplete="tel"
            inputMode="tel"
            enterKeyHint="next"
            aria-invalid={state.fieldErrors?.phone ? "true" : undefined}
            required
          />
          <FieldError errors={state.fieldErrors?.phone} />
        </label>
      </div>

      <div className="field-grid">
        <label>
          <span>Email address</span>
          <input
            className="field"
            id="cf-email"
            name="email"
            type="email"
            placeholder="Enter your email"
            autoComplete="email"
            inputMode="email"
            enterKeyHint="next"
            aria-invalid={state.fieldErrors?.email ? "true" : undefined}
            required
          />
          <FieldError errors={state.fieldErrors?.email} />
        </label>
        <label>
          <span>Password</span>
          <input
            className="field"
            id="cf-password"
            name="password"
            type="password"
            placeholder="Create a password"
            autoComplete="new-password"
            enterKeyHint="next"
            aria-invalid={state.fieldErrors?.password ? "true" : undefined}
            required
          />
          <FieldError errors={state.fieldErrors?.password} />
        </label>
      </div>

      <label className="consent-row" htmlFor="cf-privacy">
        <input
          id="cf-privacy"
          name="privacy"
          type="checkbox"
          aria-invalid={state.fieldErrors?.privacy ? "true" : undefined}
          required
        />
        <span>
          I agree that Marvel&apos;s Studios may contact me regarding my
          registration.
        </span>
      </label>
      <FieldError errors={state.fieldErrors?.privacy} />

      <SubmitButton />

      <p
        className={state.status === "success" ? "form-success show" : "form-success"}
        id="join-success"
        role="alert"
        aria-live="polite"
      >
        {state.status === "success" ? state.message : ""}
      </p>

      {state.status === "error" && state.message ? (
        <p className="form-error" role="alert" aria-live="polite">
          {state.message}
        </p>
      ) : null}

    </form>
  );
}
