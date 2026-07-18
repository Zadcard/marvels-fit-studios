import { AdminCoachesCommandCenter } from "@/components/dashboard/admin-coaches-command-center";
import { adminCoachRepository } from "@/lib/repositories/admin-coach-repository";

export const metadata = { title: "Coaches" };

export default async function AdminCoachesPage() {
  const records = await adminCoachRepository.list();

  return <AdminCoachesCommandCenter records={records} />;
}
