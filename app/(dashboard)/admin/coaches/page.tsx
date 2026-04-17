import { AdminCoachesWorkspace } from "@/components/dashboard/admin-coaches-workspace";
import { adminCoachRepository } from "@/lib/repositories/admin-coach-repository";
import { adminScheduleBlockRepository } from "@/lib/repositories/admin-schedule-block-repository";

export const metadata = {
  title: "Coaches Management",
};

export default async function AdminCoachesPage() {
  const records = await adminCoachRepository.list();
  const { blockRecords } = await adminScheduleBlockRepository.list();

  return (
    <AdminCoachesWorkspace
      records={records}
      blockOptions={blockRecords.map((block) => ({
        id: block.id,
        title: block.title,
      }))}
    />
  );
}
