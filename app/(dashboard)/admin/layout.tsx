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
  const commandItems = await dashboardCommandRepository.listForAdmin();
  const unreadNotifications = await withSupabaseFallback(
    () => countUnreadNotifications(user.id),
    0,
  );

  return (
    <DashboardRoleShell
      role="admin"
      account={{
        name: displayName,
        subtitle: user.email?.trim() || "Studio administration",
        initials: getInitials(displayName),
      }}
      commandItems={commandItems}
      navBadges={{ "/admin/notifications": unreadNotifications }}
    >
      {children}
    </DashboardRoleShell>
  );
}
