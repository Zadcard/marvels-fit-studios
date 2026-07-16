import { LoaderCircle } from "lucide-react";
import { RedlineAuthShell } from "@/components/auth/redline-auth-shell";

import "./login.css";

export default function LoginLoading() {
  return (
    <RedlineAuthShell>
      <div className="login-state-panel" role="status" aria-live="polite">
        <div className="login-state-panel__icon">
          <LoaderCircle size={22} className="animate-spin-slow" />
        </div>
        <div className="auth-kicker">Member access / loading</div>
        <h1>Loading secure login</h1>
        <p>Preparing sign-in.</p>
      </div>
    </RedlineAuthShell>
  );
}
