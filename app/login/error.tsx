"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { RedlineAuthShell } from "@/components/auth/redline-auth-shell";

import "./login.css";

type LoginErrorProps = {
  reset: () => void;
};

export default function LoginError({ reset }: LoginErrorProps) {
  return (
    <RedlineAuthShell title="The door paused." note="The secure portal hit an interruption before it could open.">
      <div className="login-state-panel" role="alert">
        <div className="login-state-panel__icon">
          <AlertTriangle size={22} />
        </div>
        <div className="auth-kicker">Member access / interrupted</div>
        <h1>We could not open the login page.</h1>
        <p>Try again or return to the website.</p>
        <div className="login-state-panel__actions">
          <button type="button" className="auth-primary-button" onClick={reset}>
            Try again
          </button>
          <Link href="/" className="auth-secondary-button">
            Back to website
          </Link>
        </div>
      </div>
    </RedlineAuthShell>
  );
}
