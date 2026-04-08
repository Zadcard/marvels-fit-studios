import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

import { ClientOverviewWorkspace } from "@/components/dashboard/client-overview-workspace";
import { requireRole } from "@/lib/auth/session";
import { clientDashboardRepository } from "@/lib/repositories/client-dashboard-repository";

export const metadata = {
  title: "Client Dashboard",
};

export const dynamic = "force-dynamic";

export default async function ClientOverviewPage() {
  let user;

  try {
    user = await requireRole(UserRole.CLIENT);
  } catch {
    redirect("/login");
  }

  const data = await clientDashboardRepository.getOverview(user.id);

  if (!data) {
    redirect("/login");
  }

  return <ClientOverviewWorkspace data={data} />;
}
