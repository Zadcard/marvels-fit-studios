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
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

import "./login.css";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  const [loginMethod, setLoginMethod] = useState<"clientId" | "email">(
    "clientId"
  );
  const [clientId, setClientId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    clientId?: string;
    email?: string;
    password?: string;
  }>({});
  const [shakeForm, setShakeForm] = useState(false);

  const clientIdInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const triggerShake = useCallback(() => {
    setShakeForm(true);
    setTimeout(() => setShakeForm(false), 350);
  }, []);

  const validateFields = useCallback((): boolean => {
    const errors: {
      clientId?: string;
      email?: string;
      password?: string;
    } = {};
    let firstInvalidField: HTMLInputElement | null = null;

    if (loginMethod === "clientId") {
      if (!clientId.trim()) {
        errors.clientId = "Please enter your Client ID or phone number";
        firstInvalidField = clientIdInputRef.current;
      } else if (!/^[+\d\s().-]{7,24}$/.test(clientId.trim())) {
        errors.clientId =
          "Enter a valid Client ID or phone number";
        firstInvalidField = clientIdInputRef.current;
      }
    } else {
      if (!email.trim()) {
        errors.email = "Please enter your email address";
        firstInvalidField = emailInputRef.current;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        errors.email = "Please enter a valid email address";
        firstInvalidField = emailInputRef.current;
      }
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
  }, [clientId, email, password, loginMethod]);

  const handleSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      setFormError("");

      if (!validateFields()) {
        triggerShake();
        return;
      }

      setIsLoading(true);

      try {
        const credentials =
          loginMethod === "clientId"
            ? {
                clientId: clientId.trim(),
                password,
              }
            : {
                email,
                password,
              };

        const result = await signIn("credentials", {
          ...credentials,
          redirect: false,
          callbackUrl:
            callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//")
              ? callbackUrl
              : "/auth/redirect",
        });

        if (result?.error) {
          if (result.error === "CredentialsSignin" || result.error === "Credentials") {
            const identifier =
              loginMethod === "clientId" ? "Client ID, phone" : "email";
            setFormError(`Invalid ${identifier} or password.`);
            (loginMethod === "clientId" ? passwordInputRef : passwordInputRef)
              .current?.focus();
          } else {
            setFormError("Something went wrong. Try again.");
          }

          triggerShake();
          setIsLoading(false);
          return;
        }

        window.location.href =
          result?.url && result.url.startsWith("/")
            ? result.url
            : callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//")
              ? callbackUrl
              : "/auth/redirect";
      } catch {
        setFormError("Unexpected error. Try again.");
        triggerShake();
        setIsLoading(false);
      }
    },
    [callbackUrl, clientId, email, password, loginMethod, triggerShake, validateFields]
  );

  const handlePasswordKeyState = (event: KeyboardEvent<HTMLInputElement>) => {
    setCapsLockOn(event.getModifierState("CapsLock"));
  };

  const clearFieldError = (
    field: "clientId" | "email" | "password"
  ) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });

    if (formError) {
      setFormError("");
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
        <div className="login-method-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={loginMethod === "clientId"}
            onClick={() => {
              setLoginMethod("clientId");
              setFieldErrors({});
              setFormError("");
            }}
            className={`login-method-tab ${
              loginMethod === "clientId" ? "active" : ""
            }`}
            disabled={isLoading}
          >
            Client ID / Phone
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={loginMethod === "email"}
            onClick={() => {
              setLoginMethod("email");
              setFieldErrors({});
              setFormError("");
            }}
            className={`login-method-tab ${
              loginMethod === "email" ? "active" : ""
            }`}
            disabled={isLoading}
          >
            Email
          </button>
        </div>

        {loginMethod === "clientId" && (
          <div className="login-field-group">
            <label className="login-field-label" htmlFor="login-client-id">
              Client ID or phone number
            </label>
            <input
              ref={clientIdInputRef}
              id="login-client-id"
              name="clientId"
              type="tel"
              className={`mv-field ${
                fieldErrors.clientId ? "field-error" : ""
              }`}
              value={clientId}
              onChange={(event) => {
                setClientId(event.target.value.slice(0, 24));
                clearFieldError("clientId");
              }}
              placeholder="e.g., 2605020 or +201012345678"
              inputMode="tel"
              autoComplete="tel"
              disabled={isLoading}
            />
            {fieldErrors.clientId ? (
              <div className="login-field-error" role="alert">
                {fieldErrors.clientId}
              </div>
            ) : null}
          </div>
        )}

        {loginMethod === "email" && (
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
        )}

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
          <p className="login-trust-note">Secure portal access.</p>
        </div>

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
