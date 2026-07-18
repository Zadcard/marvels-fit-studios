import { MarvelOpsSubscriptions } from "@/components/dashboard/marvel-ops-groups-subscriptions";
import { adminSubscriptionRepository } from "@/lib/repositories/admin-subscription-repository";
export const metadata={title:"Subscriptions"};
export default async function AdminSubscriptionsPage(){
  const { stats, records } = await adminSubscriptionRepository.list();
  return <MarvelOpsSubscriptions stats={stats} records={records}/>;
}
