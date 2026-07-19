import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { DashboardRoleShell } from "@/components/dashboard/dashboard-role-shell";
import { getDashboardHomeForUserRole } from "@/lib/auth/authorization-policy";
import { requireRole } from "@/lib/auth/session";
import { dashboardCommandRepository } from "@/lib/repositories/dashboard-command-repository";
import { countUnreadNotifications } from "@/lib/repositories/notification-repository";
import { UserRole } from "@/lib/supabase/domain";
import { getInitials } from "@/lib/utils";
import { withSupabaseFallback } from "@/lib/supabase/errors";

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
  const commandItems = await dashboardCommandRepository.listForCoachUserId(
    user.id,
  );
  const unreadNotifications = await withSupabaseFallback(
    () => countUnreadNotifications(user.id),
    0,
  );

  return (
    <DashboardRoleShell
      role="coach"
      account={{
        name: displayName,
        subtitle: user.email?.trim() || "Coach portal",
        initials: getInitials(displayName),
      }}
      commandItems={commandItems}
      navBadges={{ "/coach/alerts": unreadNotifications }}
    >
      {children}
    </DashboardRoleShell>
  );
}
