import { MarvelOpsSubscriptions } from "@/components/dashboard/marvel-ops-groups-subscriptions";
import { adminGroupRepository } from "@/lib/repositories/admin-group-repository";
import { adminSubscriptionRepository } from "@/lib/repositories/admin-subscription-repository";

export const metadata = { title: "Subscriptions" };

export default async function AdminSubscriptionsPage() {
  const [{ stats, records, clientOptions }, { records: groupRecords }] =
    await Promise.all([
      adminSubscriptionRepository.list(),
      adminGroupRepository.list(),
    ]);

  const groupOptions = groupRecords.map((g) => ({
    id: g.id,
    name: g.name,
    category: g.trainingCategory,
    scheduleSummary: g.scheduleSummary,
  }));

  return (
    <MarvelOpsSubscriptions
      stats={stats}
      records={records}
      clientOptions={clientOptions}
      groupOptions={groupOptions}
    />
  );
}
