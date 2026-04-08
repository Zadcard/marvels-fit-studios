import { AdminLeadsWorkspace } from "@/components/dashboard/admin-leads-workspace";
import { adminLeadRepository } from "@/lib/repositories/admin-lead-repository";

export const metadata = {
  title: "Leads Management",
};

export default async function AdminLeadsPage() {
  const records = await adminLeadRepository.list();

  return <AdminLeadsWorkspace records={records} />;
}
