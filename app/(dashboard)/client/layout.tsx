import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { DashboardRoleShell } from "@/components/dashboard/dashboard-role-shell";
import { getDashboardHomeForUserRole } from "@/lib/auth/authorization-policy";
import { requireRole } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { UserRole } from "@/lib/supabase/domain";
import { getInitials } from "@/lib/utils";

export default async function ClientDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  if (!session?.user?.role) {
    redirect("/login");
  }

  if (session.user.role !== UserRole.CLIENT) {
    redirect(getDashboardHomeForUserRole(session.user.role));
  }

  const persistedUser = await requireRole(UserRole.CLIENT);

  const { data: user, error } = await getSupabaseServerClient()
    .from("User")
    .select("name,email,clientId,clientProfile:Client(fullName)")
    .eq("id", session.user.id)
    .maybeSingle();
  if (error) throw error;

  if (persistedUser.mustChangePassword) {
    redirect("/change-password");
  }

  if (!user) {
    redirect("/login");
  }

  const displayName =
    user?.clientProfile?.[0]?.fullName?.trim() ||
    user?.name?.trim() ||
    user?.clientId?.trim() ||
    "Client";
  const displaySubtitle =
    user?.clientId?.trim()
      ? `Client ID ${user.clientId}`
      : user?.email?.trim() || "Client portal";

  return (
    <DashboardRoleShell
      role="client"
      account={{
        name: displayName,
        subtitle: displaySubtitle,
        initials: getInitials(displayName),
      }}
    >
      {children}
    </DashboardRoleShell>
  );
}
