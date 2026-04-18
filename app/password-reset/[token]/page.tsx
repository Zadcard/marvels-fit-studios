import "@/app/login/login.css";

import { ResetPasswordForm } from "@/app/password-reset/[token]/reset-password-form";

export const metadata = {
  title: "Reset Password",
};

export default async function PasswordResetTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <main className="login-page">
      <div className="login-container">
        <ResetPasswordForm token={token} />
      </div>
    </main>
  );
}
