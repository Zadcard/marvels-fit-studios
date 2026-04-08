import { AdminSubscriptionsWorkspace } from "@/components/dashboard/admin-subscriptions-workspace";
import { adminSubscriptionRepository } from "@/lib/repositories/admin-subscription-repository";

export const metadata = {
  title: "Subscriptions Management",
};

export default async function AdminSubscriptionsPage() {
  const { stats, records } = await adminSubscriptionRepository.list();

  return <AdminSubscriptionsWorkspace stats={stats} records={records} />;
}
