import { LoaderCircle } from "lucide-react";

import "./login.css";

export default function LoginLoading() {
  return (
    <div className="login-page">
      <div className="login-state-panel" role="status" aria-live="polite">
        <div className="login-state-panel__icon">
          <LoaderCircle size={22} className="animate-spin-slow" />
        </div>
        <div className="mv-eyebrow">Member Access</div>
        <h1>Loading secure login</h1>
        <p>Preparing sign-in.</p>
      </div>
    </div>
  );
}
