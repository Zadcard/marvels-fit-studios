import { LoaderCircle } from "lucide-react";
import { OpsAuthShell } from "@/components/auth/ops-auth-shell";

import "./login.css";

export default function LoginLoading() {
  return (
    <OpsAuthShell>
      <div className="login-state-panel" role="status" aria-live="polite">
        <div className="login-state-panel__icon">
          <LoaderCircle size={22} className="animate-spin-slow" />
        </div>
        <div className="auth-kicker">Operations access / loading</div>
        <h1>Loading secure login</h1>
        <p>Preparing sign-in.</p>
      </div>
    </OpsAuthShell>
  );
}
