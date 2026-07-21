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

  const groupOptions = groupRecords.filter((g) => g.isActive).map((g) => ({
    id: g.id,
    name: g.name,
    trainingCategory: g.categoryName,
    coachName: g.coachName,
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
