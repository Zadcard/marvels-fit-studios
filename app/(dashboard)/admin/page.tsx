import { MarvelOpsToday } from "@/components/dashboard/marvel-ops-today";
import { adminTodayOperationsRepository } from "@/lib/repositories/admin-today-operations-repository";

export const metadata = { title: "Today" };

export default async function AdminOverviewPage() {
  return <MarvelOpsToday data={await adminTodayOperationsRepository.getToday()} />;
}
