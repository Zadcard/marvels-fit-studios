import { MarvelOpsReports } from "@/components/dashboard/marvel-ops-admin-meta";
import { adminOverviewRepository } from "@/lib/repositories/admin-overview-repository";

export const metadata = { title: "Reports" };

export default async function AdminReportsPage() {
  return <MarvelOpsReports stats={(await adminOverviewRepository.getOverview()).stats} />;
}
