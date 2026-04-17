import { AdminClientsWorkspace } from "@/components/dashboard/admin-clients-workspace";
import { adminClientRepository } from "@/lib/repositories/admin-client-repository";
import { adminScheduleBlockRepository } from "@/lib/repositories/admin-schedule-block-repository";

export const metadata = {
  title: "Clients Management",
};

export default async function AdminClientsPage() {
  const records = await adminClientRepository.list();
  const { blockRecords, groupOptions } = await adminScheduleBlockRepository.list();

  return (
    <AdminClientsWorkspace
      records={records}
      blockOptions={blockRecords.map((block) => ({
        id: block.id,
        title: block.title,
      }))}
      groupOptions={groupOptions}
    />
  );
}
