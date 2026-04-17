import "@/app/login/login.css";

import { PasswordResetRequestForm } from "@/app/password-reset/request/password-reset-request-form";

export const metadata = {
  title: "Request Password Reset",
};

export default function PasswordResetRequestPage() {
  return (
    <main className="login-page">
      <div className="login-container">
        <PasswordResetRequestForm />
      </div>
    </main>
  );
}
