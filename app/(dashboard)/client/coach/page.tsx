import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ClientCoachWorkspace } from "@/components/dashboard/client-coach-workspace";
import { clientDashboardRepository } from "@/lib/repositories/client-dashboard-repository";

export const metadata = {
  title: "My Coach",
};

export default async function ClientCoachPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const data = await clientDashboardRepository.getCoach(session.user.id);

  if (!data) {
    redirect("/login");
  }

  return <ClientCoachWorkspace data={data} />;
}
