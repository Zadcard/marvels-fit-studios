"use client";

import { useState, useCallback, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import "./login.css";

export default function LoginPage() {
  const router = useRouter();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [shakeForm, setShakeForm] = useState(false);

  const triggerShake = useCallback(() => {
    setShakeForm(true);
    setTimeout(() => setShakeForm(false), 350);
  }, []);

  const validateFields = useCallback((): boolean => {
    const errors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      errors.email = "Please enter your email address";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Please enter a valid email address";
    }

    if (!password) {
      errors.password = "Please enter your password";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [email, password]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setFormError("");

      if (!validateFields()) {
        triggerShake();
        return;
      }

      setIsLoading(true);

      // Mock login — simulate network delay then redirect
      await new Promise((resolve) => setTimeout(resolve, 1200));

      // Mock: accept any valid-looking credentials
      // In backend phase, this will call a server action
      if (email && password) {
        router.push("/admin");
      } else {
        setFormError("Invalid email or password. Please try again.");
        setIsLoading(false);
        triggerShake();
      }
    },
    [email, password, validateFields, triggerShake, router]
  );

  const clearFieldError = (field: "email" | "password") => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
    if (formError) setFormError("");
  };

  return (
    <div className="login-page">
      <div
        className={`login-container ${shakeForm ? "animate-shake" : ""}`}
      >
        {/* ─── Brand Panel ─── */}
        <div className="login-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/img/Logo-2.png"
            alt="Marvel's Studios"
            className="login-brand-logo"
            width={56}
            height={56}
          />

          <div className="login-brand-name">Marvel&apos;s Studios</div>

          <h1 className="login-brand-tagline">
            Train with more structure, better coaching, and clearer progress.
          </h1>

          <p className="login-brand-description">
            Access your personalized dashboard to manage sessions, track your
            training, and stay connected with your coaches.
          </p>

          <div className="login-brand-badge">
            <strong>3k+</strong>
            <span>sessions supported</span>
          </div>
        </div>

        {/* ─── Form Panel ─── */}
        <div className="login-form-panel">
          <div className="login-form-header">
            <div className="mv-eyebrow">Member Access</div>
            <h2 className="login-form-title">Welcome back</h2>
            <p className="login-form-subtitle">
              Sign in to access your dashboard, sessions, and training progress.
            </p>
          </div>

          {/* Form-level error */}
          {formError && (
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
          )}

          <form
            className="login-form"
            onSubmit={handleSubmit}
            noValidate
          >
            {/* Email */}
            <div className="login-field-group">
              <label className="login-field-label" htmlFor="login-email">
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                className={`mv-field ${fieldErrors.email ? "field-error" : ""}`}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearFieldError("email");
                }}
                placeholder="name@example.com"
                autoComplete="email"
                autoFocus
                aria-invalid={!!fieldErrors.email}
                aria-describedby={
                  fieldErrors.email ? "login-email-error" : undefined
                }
                disabled={isLoading}
              />
              {fieldErrors.email && (
                <div
                  id="login-email-error"
                  className="login-field-error"
                  role="alert"
                >
                  {fieldErrors.email}
                </div>
              )}
            </div>

            {/* Password */}
            <div className="login-field-group">
              <label className="login-field-label" htmlFor="login-password">
                Password
              </label>
              <div className="login-field-wrap">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  className={`mv-field ${fieldErrors.password ? "field-error" : ""}`}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearFieldError("password");
                  }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby={
                    fieldErrors.password ? "login-password-error" : undefined
                  }
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    /* Eye-off icon */
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
                    /* Eye icon */
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
              {fieldErrors.password && (
                <div
                  id="login-password-error"
                  className="login-field-error"
                  role="alert"
                >
                  {fieldErrors.password}
                </div>
              )}
            </div>

            {/* Options row */}
            <div className="login-options">
              <label className="login-remember">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                />
                Remember me
              </label>
              <button
                type="button"
                className="login-forgot"
                onClick={() => {
                  /* Placeholder — will be wired in backend phase */
                }}
              >
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="mv-btn mv-btn-primary login-submit"
              disabled={isLoading}
              aria-busy={isLoading}
            >
              <span className="login-submit-content">
                {isLoading && <span className="login-spinner" />}
                {isLoading ? "Signing in..." : "Sign In"}
              </span>
            </button>
          </form>

          {/* Back to website */}
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
      </div>
    </div>
  );
}
