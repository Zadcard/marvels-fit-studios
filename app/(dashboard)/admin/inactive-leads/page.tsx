import { AdminInactiveLeadsWorkspace } from "@/components/dashboard/admin-inactive-leads-workspace";
import { adminLeadRepository } from "@/lib/repositories/admin-lead-repository";

export const metadata = { title: "Inactive Leads" };

export default async function AdminInactiveLeadsPage() {
  const { records, totalCount, lostCount, convertedCount } =
    await adminLeadRepository.listInactive();

  return (
    <AdminInactiveLeadsWorkspace
      records={records}
      totalCount={totalCount}
      lostCount={lostCount}
      convertedCount={convertedCount}
    />
  );
}
