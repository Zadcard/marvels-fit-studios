import "@/app/login/login.css";

import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { RequiredPasswordChangeForm } from "@/app/change-password/change-password-form";
import { getDashboardHomeForUserRole } from "@/lib/auth/authorization-policy";
import { getSupabaseServerClient } from "@/lib/supabase/server";

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
    <main className="login-page">
      <div className="login-container">
        <RequiredPasswordChangeForm />
      </div>
    </main>
  );
}
