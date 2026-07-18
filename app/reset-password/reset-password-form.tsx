"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, KeyRound } from "lucide-react";
import { useState, type FormEvent } from "react";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [complete, setComplete] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setPending(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword, confirmPassword }),
      });
      const result = (await response.json()) as { error?: string; ok?: boolean };

      if (!response.ok || !result.ok) {
        setError(result.error ?? "Password could not be reset.");
        return;
      }

      window.history.replaceState(null, "", "/reset-password");
      setComplete(true);
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError("Password recovery is temporarily unavailable.");
    } finally {
      setPending(false);
    }
  }

  if (complete) {
    return (
      <section className="login-state-panel" aria-live="polite">
        <span className="login-state-panel__icon"><CheckCircle2 /></span>
        <div className="auth-kicker">Access restored</div>
        <h1>Password updated</h1>
        <p>Your one-time link has been consumed. Sign in with the new password.</p>
        <div className="login-state-panel__actions">
          <Link className="auth-primary-button" href="/login">Return to sign in</Link>
        </div>
      </section>
    );
  }

  if (!token) {
    return (
      <section className="login-state-panel">
        <span className="login-state-panel__icon"><KeyRound /></span>
        <div className="auth-kicker">One-time recovery</div>
        <h1>Reset link required</h1>
        <p>Ask your studio administrator to issue a new password-reset link.</p>
        <div className="login-state-panel__actions">
          <Link className="auth-secondary-button" href="/login">Return to sign in</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="login-form-panel">
      <div className="login-form-header">
        <div className="auth-kicker">One-time recovery / 30 minutes</div>
        <h1 className="login-form-title">Choose a new password</h1>
        <p className="login-form-subtitle">
          Use at least 8 characters with one letter and one number. The link stops working after this reset.
        </p>
      </div>

      {error ? <div className="login-error" role="alert">{error}</div> : null}

      <form className="login-form" onSubmit={submit} noValidate>
        <label className="login-field-group">
          <span className="login-field-label">New password</span>
          <input
            className="auth-field"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            disabled={pending}
            required
          />
        </label>
        <label className="login-field-group">
          <span className="login-field-label">Confirm new password</span>
          <input
            className="auth-field"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            disabled={pending}
            required
          />
        </label>
        <button className="auth-primary-button login-submit" type="submit" disabled={pending}>
          {pending ? "Updating password…" : "Update password"}
        </button>
      </form>
    </section>
  );
}
