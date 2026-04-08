import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

import { ClientSessionsWorkspace } from "@/components/dashboard/client-sessions-workspace";
import { requireRole } from "@/lib/auth/session";
import { clientDashboardRepository } from "@/lib/repositories/client-dashboard-repository";

export const metadata = {
  title: "My Sessions",
};

export default async function ClientSessionsPage() {
  let user;

  try {
    user = await requireRole(UserRole.CLIENT);
  } catch {
    redirect("/login");
  }

  const records = await clientDashboardRepository.getSessions(user.id);

  return <ClientSessionsWorkspace records={records} />;
}
