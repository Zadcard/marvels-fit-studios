import { AdminCoachesWorkspace } from "@/components/dashboard/admin-coaches-workspace";
import { adminCoachRepository } from "@/lib/repositories/admin-coach-repository";

export const metadata = {
  title: "Coaches Management",
};

export default async function AdminCoachesPage() {
  const records = await adminCoachRepository.list();

  return <AdminCoachesWorkspace records={records} />;
}
