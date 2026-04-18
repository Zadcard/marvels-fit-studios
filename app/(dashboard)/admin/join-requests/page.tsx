import { AdminLeadsWorkspace } from "@/components/dashboard/admin-leads-workspace";
import { adminLeadRepository } from "@/lib/repositories/admin-lead-repository";

export const metadata = {
  title: "Join Requests",
};

export default async function AdminJoinRequestsPage() {
  const records = await adminLeadRepository.list();

  return <AdminLeadsWorkspace records={records} />;
}
