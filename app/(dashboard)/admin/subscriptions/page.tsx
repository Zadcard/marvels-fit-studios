import { AdminSubscriptionsWorkspace } from "@/components/dashboard/admin-subscriptions-workspace";
import { adminSubscriptionRepository } from "@/lib/repositories/admin-subscription-repository";

export const metadata = {
  title: "Subscriptions Management",
};

export const dynamic = "force-dynamic";

export default async function AdminSubscriptionsPage() {
  const { stats, records, clientOptions, planOptions } =
    await adminSubscriptionRepository.list();

  return (
    <AdminSubscriptionsWorkspace
      stats={stats}
      records={records}
      clientOptions={clientOptions}
      planOptions={planOptions}
    />
  );
}
