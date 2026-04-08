import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ClientSubscriptionWorkspace } from "@/components/dashboard/client-subscription-workspace";
import { clientDashboardRepository } from "@/lib/repositories/client-dashboard-repository";

export const metadata = {
  title: "My Subscription",
};

export default async function ClientSubscriptionPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const data = await clientDashboardRepository.getSubscription(session.user.id);

  if (!data) {
    redirect("/login");
  }

  return <ClientSubscriptionWorkspace data={data} />;
}
