import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

import { ClientSubscriptionWorkspace } from "@/components/dashboard/client-subscription-workspace";
import { requireRole } from "@/lib/auth/session";
import { clientDashboardRepository } from "@/lib/repositories/client-dashboard-repository";

export const metadata = {
  title: "My Subscription",
};

export default async function ClientSubscriptionPage() {
  try {
    const user = await requireRole(UserRole.CLIENT);
    const data = await clientDashboardRepository.getSubscription(user.id);

    if (!data) {
      redirect("/login");
    }

    return <ClientSubscriptionWorkspace data={data} />;
  } catch {
    redirect("/login");
  }
}
