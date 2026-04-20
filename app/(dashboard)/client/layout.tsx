import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { DashboardRoleShell } from "@/components/dashboard/dashboard-role-shell";
import { getDashboardHomeForUserRole } from "@/lib/auth/authorization-policy";
import { getPrisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

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

  const user = await getPrisma().user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      clientId: true,
      mustChangePassword: true,
      clientProfile: {
        select: {
          fullName: true,
        },
      },
    },
  });

  if (user?.mustChangePassword) {
    redirect("/change-password");
  }

  const displayName =
    user?.clientProfile?.fullName?.trim() ||
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
