import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ClientOverviewWorkspace } from "@/components/dashboard/client-overview-workspace";
import { clientDashboardRepository } from "@/lib/repositories/client-dashboard-repository";

export const metadata = {
  title: "Client Dashboard",
};

export default async function ClientOverviewPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const data = await clientDashboardRepository.getOverview(session.user.id);

  if (!data) {
    redirect("/login");
  }

  return <ClientOverviewWorkspace data={data} />;
}
