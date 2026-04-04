"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import "./login.css";

type LoginErrorProps = {
  reset: () => void;
};

export default function LoginError({ reset }: LoginErrorProps) {
  return (
    <div className="login-page">
      <div className="login-state-panel" role="alert">
        <div className="login-state-panel__icon">
          <AlertTriangle size={22} />
        </div>
        <div className="mv-eyebrow">Member Access</div>
        <h1>We could not open the login page.</h1>
        <p>Try again or return to the website.</p>
        <div className="login-state-panel__actions">
          <button type="button" className="mv-btn mv-btn-primary" onClick={reset}>
            Try again
          </button>
          <Link href="/" className="mv-btn mv-btn-outline">
            Back to website
          </Link>
        </div>
      </div>
    </div>
  );
}
