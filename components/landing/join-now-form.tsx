"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";

import {
  initialJoinNowState,
  submitJoinNowLead,
} from "@/app/actions/landing";

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

      <label>
        <span>Your question</span>
        <textarea
          className="field field-area"
          id="cf-msg"
          name="message"
          placeholder="Tell us what you want help with"
          enterKeyHint="send"
        ></textarea>
        <FieldError errors={state.fieldErrors?.message} />
      </label>

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

      <div className="contact-form-note" role="note" aria-label="Registration next steps">
        <strong>What happens next</strong>
        <p>
          Send your registration request and the studio team will review it,
          contact you, and confirm the right membership path before anything else moves forward.
        </p>
      </div>

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

      <div className="form-footer-social" aria-label="Studio social media">
        <a
          href="https://wa.me/201033724777"
          target="_blank"
          rel="noopener noreferrer"
          className="whatsapp-btn"
          aria-label="Message Marvel's Studios on WhatsApp"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          <span>WhatsApp</span>
        </a>

        <a
          href="https://www.instagram.com/marvelsfitstudios?igsh=aTZkZTRvNHE0azJj"
          target="_blank"
          rel="noopener noreferrer"
          className="social-btn social-btn-instagram"
          aria-label="Follow Marvel's Studios on Instagram"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2m0 1.8A3.95 3.95 0 0 0 3.8 7.75v8.5A3.95 3.95 0 0 0 7.75 20.2h8.5a3.95 3.95 0 0 0 3.95-3.95v-8.5a3.95 3.95 0 0 0-3.95-3.95h-8.5M17.7 5.35a.95.95 0 1 1 0 1.9.95.95 0 0 1 0-1.9M12 6.85A5.15 5.15 0 1 1 6.85 12 5.16 5.16 0 0 1 12 6.85m0 1.8A3.35 3.35 0 1 0 15.35 12 3.35 3.35 0 0 0 12 8.65" />
          </svg>
          <span>Instagram</span>
        </a>
        <a
          href="https://www.tiktok.com/@marvelsfitstudios"
          target="_blank"
          rel="noopener noreferrer"
          className="social-btn social-btn-tiktok"
          aria-label="Follow Marvel's Studios on TikTok"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M14.5 3c.42 1.64 1.38 2.95 2.88 3.93 1.08.7 2.23 1.07 3.45 1.11v3.12a9.42 9.42 0 0 1-3.7-.74v5.86c0 1.56-.55 2.89-1.66 4-1.1 1.09-2.43 1.64-3.98 1.64s-2.88-.55-3.99-1.64A5.43 5.43 0 0 1 5.85 16.3c0-1.56.55-2.9 1.65-4 .99-.98 2.17-1.53 3.55-1.63v3.22a2.33 2.33 0 0 0-1.2.67c-.47.46-.7 1.03-.7 1.72 0 .69.23 1.26.7 1.73.47.47 1.05.7 1.74.7.68 0 1.26-.23 1.72-.7.47-.47.7-1.04.7-1.73V3h3.19Z" />
          </svg>
          <span>TikTok</span>
        </a>
        <a
          href="https://www.facebook.com/share/1CP9fjSoF8/"
          target="_blank"
          rel="noopener noreferrer"
          className="social-btn social-btn-facebook"
          aria-label="Follow Marvel's Studios on Facebook"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M13.25 22v-8.03h2.7l.4-3.13h-3.1V8.84c0-.9.25-1.52 1.55-1.52h1.66V4.51c-.29-.04-1.27-.11-2.41-.11-2.39 0-4.03 1.46-4.03 4.14v2.3H7.3v3.13h2.72V22h3.23Z" />
          </svg>
          <span>Facebook</span>
        </a>
      </div>
    </form>
  );
}
