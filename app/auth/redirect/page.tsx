import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getDashboardHomeForUserRole } from "@/lib/auth/authorization-policy";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Redirecting",
};

export default async function AuthRedirectPage() {
  const session = await auth();
  const userRole = session?.user?.role;

  if (!userRole) {
    redirect("/login");
  }

  if (session.user.id) {
    try {
      const { data: user } = await getSupabaseServerClient()
        .from("User")
        .select("mustChangePassword")
        .eq("id", session.user.id)
        .maybeSingle();

      if (user?.mustChangePassword) {
        redirect("/change-password");
      }
    } catch {
      // DB unavailable (local dev without env vars) — skip the check
    }
  }

  redirect(getDashboardHomeForUserRole(userRole));
}
