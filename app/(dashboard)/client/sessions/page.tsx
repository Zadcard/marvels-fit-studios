import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ClientSessionsWorkspace } from "@/components/dashboard/client-sessions-workspace";
import { clientDashboardRepository } from "@/lib/repositories/client-dashboard-repository";

export const metadata = {
  title: "My Sessions",
};

export default async function ClientSessionsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const records = await clientDashboardRepository.getSessions(session.user.id);

  return <ClientSessionsWorkspace records={records} />;
}
