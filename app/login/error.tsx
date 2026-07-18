"use client";

import { AlertTriangle } from "lucide-react";
import { OpsAuthShell } from "@/components/auth/ops-auth-shell";

import "./login.css";

type LoginErrorProps = {
  reset: () => void;
};

export default function LoginError({ reset }: LoginErrorProps) {
  return (
    <OpsAuthShell title="The workspace paused." note="The secure sign-in flow hit an interruption before it could open.">
      <div className="login-state-panel" role="alert">
        <div className="login-state-panel__icon">
          <AlertTriangle size={22} />
        </div>
        <div className="auth-kicker">Operations access / interrupted</div>
        <h1>We could not open the login page.</h1>
        <p>Try again. If it continues, contact the studio administrator.</p>
        <div className="login-state-panel__actions">
          <button type="button" className="auth-primary-button" onClick={reset}>
            Try again
          </button>
        </div>
      </div>
    </OpsAuthShell>
  );
}
