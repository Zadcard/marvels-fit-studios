import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { DashboardRoleShell } from "@/components/dashboard/dashboard-role-shell";
import { getDashboardHomeForUserRole } from "@/lib/auth/authorization-policy";
import { UserRole } from "@prisma/client";

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

  return (
    <DashboardRoleShell role="coach">
      {children}
    </DashboardRoleShell>
  );
}
