"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";

import { submitJoinNowLead } from "@/app/actions/landing";
import {
  initialJoinNowState,
  type JoinNowActionState,
} from "@/app/actions/join-now-types";
import { trackEvent } from "@/lib/analytics/client";

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
      {pending ? "Submitting request..." : "Submit Request"}
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

function classifyJoinNowFailure(state: JoinNowActionState) {
  const phoneErrors = state.fieldErrors?.phone ?? [];

  if (phoneErrors.some((error) => error.includes("already"))) {
    return "duplicate_phone";
  }

  if (state.fieldErrors && Object.keys(state.fieldErrors).length > 0) {
    return "validation";
  }

  return "server_error";
}

export function JoinNowForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const activeSubmissionIdRef = useRef<number | null>(null);
  const trackedSubmissionIdRef = useRef<number | null>(null);
  const submissionCounterRef = useRef(0);
  const [state, formAction] = useActionState(
    submitJoinNowLead,
    initialJoinNowState
  );

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }

    const activeSubmissionId = activeSubmissionIdRef.current;

    if (
      !activeSubmissionId ||
      trackedSubmissionIdRef.current === activeSubmissionId
    ) {
      return;
    }

    if (state.status === "success") {
      trackEvent("landing_join_form_submit_succeeded", {
        form_id: "join_now_form",
        lead_source: "landing-join-now",
      });
      trackedSubmissionIdRef.current = activeSubmissionId;
      return;
    }

    if (state.status === "error") {
      trackEvent("landing_join_form_submit_failed", {
        form_id: "join_now_form",
        lead_source: "landing-join-now",
        failure_reason: classifyJoinNowFailure(state),
        field_error_count: Object.keys(state.fieldErrors ?? {}).length,
      });
      trackedSubmissionIdRef.current = activeSubmissionId;
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      id="joinNowForm"
      className="join-form"
      action={formAction}
      onSubmitCapture={() => {
        submissionCounterRef.current += 1;
        activeSubmissionIdRef.current = submissionCounterRef.current;

        trackEvent("landing_join_form_submit_attempted", {
          form_id: "join_now_form",
          lead_source: "landing-join-now",
        });
      }}
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
            enterKeyHint="done"
            aria-invalid={state.fieldErrors?.phone ? "true" : undefined}
            required
          />
          <FieldError errors={state.fieldErrors?.phone} />
        </label>
      </div>

      <SubmitButton />

      {state.status === "success" && state.credentials ? (
        <div className="join-credentials-screen join-credentials-screen--landing show" id="join-success" role="alert">
          <div className="join-credentials-screen__header">
            <strong>Your account details</strong>
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
      ) : (
        <p className="form-success" id="join-success" aria-live="polite" />
      )}

      {state.status === "error" && state.message ? (
        <p className="form-error" role="alert" aria-live="polite">
          {state.message}
        </p>
      ) : null}

    </form>
  );
}
