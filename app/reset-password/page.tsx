import type { Metadata } from "next";
import { Suspense } from "react";

import { OpsAuthShell } from "@/components/auth/ops-auth-shell";
import { ResetPasswordForm } from "./reset-password-form";

import "../login/login.css";

export const metadata: Metadata = {
  title: "Reset password | Marvel Fitness Studios",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function ResetPasswordPage() {
  return (
    <OpsAuthShell>
      <Suspense fallback={<div className="login-loading">Loading password recovery…</div>}>
        <ResetPasswordForm />
      </Suspense>
    </OpsAuthShell>
  );
}
