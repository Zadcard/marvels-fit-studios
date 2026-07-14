import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { DashboardRoleShell } from "@/components/dashboard/dashboard-role-shell";
import { getDashboardHomeForUserRole } from "@/lib/auth/authorization-policy";
import { requireRole } from "@/lib/auth/session";
import { UserRole } from "@/lib/supabase/domain";
import { getInitials } from "@/lib/utils";

export default async function CoachDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  if (!session?.user?.role) {
    redirect("/login");
  }

  if (session.user.role !== UserRole.COACH) {
    redirect(getDashboardHomeForUserRole(session.user.role));
  }

  const user = await requireRole(UserRole.COACH);

  if (user.mustChangePassword) {
    redirect("/change-password");
  }

  const displayName = user.name?.trim() || user.email?.trim() || "Coach";

  return (
    <DashboardRoleShell
      role="coach"
      account={{
        name: displayName,
        subtitle: user.email?.trim() || "Coach portal",
        initials: getInitials(displayName),
      }}
    >
      {children}
    </DashboardRoleShell>
  );
}
