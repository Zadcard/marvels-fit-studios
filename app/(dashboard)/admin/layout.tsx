import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { DashboardRoleShell } from "@/components/dashboard/dashboard-role-shell";
import { getDashboardHomeForUserRole } from "@/lib/auth/authorization-policy";
import { requireRole } from "@/lib/auth/session";
import { UserRole } from "@/lib/supabase/domain";
import { getInitials } from "@/lib/utils";

export default async function AdminDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  if (!session?.user?.role) {
    redirect("/login");
  }

  if (session.user.role !== UserRole.ADMIN) {
    redirect(getDashboardHomeForUserRole(session.user.role));
  }

  const user = await requireRole(UserRole.ADMIN);

  if (user.mustChangePassword) {
    redirect("/change-password");
  }

  const displayName =
    user.name?.trim() || user.email?.trim() || "Studio admin";

  return (
    <DashboardRoleShell
      role="admin"
      account={{
        name: displayName,
        subtitle: user.email?.trim() || "Studio administration",
        initials: getInitials(displayName),
      }}
    >
      {children}
    </DashboardRoleShell>
  );
}
