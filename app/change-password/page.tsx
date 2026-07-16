import "@/app/login/login.css";

import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { RequiredPasswordChangeForm } from "@/app/change-password/change-password-form";
import { getDashboardHomeForUserRole } from "@/lib/auth/authorization-policy";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { RedlineAuthShell } from "@/components/auth/redline-auth-shell";

export const metadata = {
  title: "Change Password",
};

export default async function ChangePasswordPage() {
  const session = await auth();

  if (!session?.user?.id || !session.user.role) {
    redirect("/login");
  }

  const { data: user } = await getSupabaseServerClient()
    .from("User")
    .select("mustChangePassword")
    .eq("id", session.user.id)
    .maybeSingle();

  if (!user?.mustChangePassword) {
    redirect(getDashboardHomeForUserRole(session.user.role));
  }

  return (
    <RedlineAuthShell
      eyebrow="Account control"
      title="Make the access yours."
      note="Replace the temporary credential before opening the studio dashboard."
    >
      <RequiredPasswordChangeForm />
    </RedlineAuthShell>
  );
}
