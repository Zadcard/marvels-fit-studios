"use client";

import {
  Suspense,
  useCallback,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getSession, signIn } from "next-auth/react";

import { getDashboardHomeForUserRole } from "@/lib/auth/authorization-policy";

import "./login.css";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [helperMessage, setHelperMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [shakeForm, setShakeForm] = useState(false);

  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const triggerShake = useCallback(() => {
    setShakeForm(true);
    setTimeout(() => setShakeForm(false), 350);
  }, []);

  const validateFields = useCallback((): boolean => {
    const errors: { email?: string; password?: string } = {};
    let firstInvalidField: HTMLInputElement | null = null;

    if (!email.trim()) {
      errors.email = "Please enter your email address";
      firstInvalidField = emailInputRef.current;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Please enter a valid email address";
      firstInvalidField = emailInputRef.current;
    }

    if (!password) {
      errors.password = "Please enter your password";
      firstInvalidField ??= passwordInputRef.current;
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters";
      firstInvalidField ??= passwordInputRef.current;
    }

    setFieldErrors(errors);
    firstInvalidField?.focus();
    return Object.keys(errors).length === 0;
  }, [email, password]);

  const handleSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      setFormError("");
      setHelperMessage("");

      if (!validateFields()) {
        triggerShake();
        return;
      }

      setIsLoading(true);

      try {
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          if (result.error === "CredentialsSignin" || result.error === "Credentials") {
            setFormError("Invalid email or password.");
            passwordInputRef.current?.focus();
          } else {
            setFormError("Something went wrong. Try again.");
          }

          triggerShake();
          setIsLoading(false);
          return;
        }

        const session = await getSession();
        const userRole = session?.user?.role;

        if (!userRole) {
          setFormError("Account found, but no role is assigned.");
          setIsLoading(false);
          return;
        }

        const safeCallbackUrl = callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : null;
        router.replace(safeCallbackUrl || getDashboardHomeForUserRole(userRole));
        router.refresh();
      } catch {
        setFormError("Unexpected error. Try again.");
        triggerShake();
        setIsLoading(false);
      }
    },
    [callbackUrl, email, password, router, triggerShake, validateFields]
  );

  const handlePasswordKeyState = (event: KeyboardEvent<HTMLInputElement>) => {
    setCapsLockOn(event.getModifierState("CapsLock"));
  };

  const clearFieldError = (field: "email" | "password") => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });

    if (formError) {
      setFormError("");
    }

    if (helperMessage) {
      setHelperMessage("");
    }
  };

  return (
    <div className="login-form-panel">
        <div className="login-form-header">
          <div className="mv-eyebrow">Member Access</div>
          <h2 className="login-form-title">Welcome back</h2>
          <p className="login-form-subtitle">
            Sign in to access your dashboard and sessions.
          </p>
        </div>

      {callbackUrl ? (
        <div className="login-callout" role="status">
          Sign in to continue.
        </div>
      ) : null}

      {formError ? (
        <div className="login-error" role="alert">
          <svg
            className="login-error-icon"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          {formError}
        </div>
      ) : null}

      <form
        className={`login-form ${shakeForm ? "animate-shake" : ""}`}
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="login-field-group">
          <label className="login-field-label" htmlFor="login-email">
            Email address
          </label>
          <input
            ref={emailInputRef}
            id="login-email"
            name="email"
            type="email"
            className={`mv-field ${fieldErrors.email ? "field-error" : ""}`}
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              clearFieldError("email");
            }}
            placeholder="name@example.com"
            autoComplete="email"
            inputMode="email"
            spellCheck={false}
            disabled={isLoading}
          />
          {fieldErrors.email ? (
            <div className="login-field-error" role="alert">
              {fieldErrors.email}
            </div>
          ) : null}
        </div>

        <div className="login-field-group">
          <label className="login-field-label" htmlFor="login-password">
            Password
          </label>
          <div className="login-field-wrap">
            <input
              ref={passwordInputRef}
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              className={`mv-field ${fieldErrors.password ? "field-error" : ""}`}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                clearFieldError("password");
              }}
              onKeyDown={handlePasswordKeyState}
              onKeyUp={handlePasswordKeyState}
              placeholder="Enter your password"
              autoComplete="current-password"
              disabled={isLoading}
            />
            <button
              type="button"
              className="login-password-toggle"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              disabled={isLoading}
            >
              {showPassword ? (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          {fieldErrors.password ? (
            <div className="login-field-error" role="alert">
              {fieldErrors.password}
            </div>
          ) : null}
          {!fieldErrors.password && capsLockOn ? (
            <div className="login-inline-note" role="status">
              Caps Lock is on.
            </div>
          ) : null}
        </div>

        <div className="login-help-row">
          <p className="login-trust-note">
            Secure portal access.
          </p>
          <button
            type="button"
            className="login-forgot"
            onClick={() =>
              setHelperMessage(
                "Need help? Contact the studio team on WhatsApp at +20 103 372 4777."
              )
            }
            disabled={isLoading}
          >
            Need help signing in?
          </button>
        </div>

        {helperMessage ? (
          <div className="login-helper-note" role="status">
            {helperMessage}
          </div>
        ) : null}

        <button
          type="submit"
          className="mv-btn mv-btn-primary login-submit"
          disabled={isLoading}
        >
          <span className="login-submit-content">
            {isLoading ? <span className="login-spinner" /> : null}
            {isLoading ? "Signing in..." : "Sign in"}
          </span>
        </button>
      </form>

      <Link href="/" className="login-back">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Back to website
      </Link>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="login-page">
      <div className="login-container">
        <Suspense fallback={<div className="login-loading">Loading secure login...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
