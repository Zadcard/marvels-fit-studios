import { AdminOverviewScreen } from "@/components/dashboard/admin-overview-screen";
import { adminOverviewRepository } from "@/lib/repositories/admin-overview-repository";

export const metadata = {
  title: "Admin Dashboard",
};

export default async function AdminOverviewPage() {
  const data = await adminOverviewRepository.getOverview();

  return <AdminOverviewScreen {...data} />;
}
