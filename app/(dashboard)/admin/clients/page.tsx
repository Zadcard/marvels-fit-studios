import { AdminClientsWorkspace } from "@/components/dashboard/admin-clients-workspace";
import { adminClientRepository } from "@/lib/repositories/admin-client-repository";

export const metadata = {
  title: "Clients Management",
};

export default async function AdminClientsPage() {
  const records = await adminClientRepository.list();

  return <AdminClientsWorkspace records={records} />;
}
