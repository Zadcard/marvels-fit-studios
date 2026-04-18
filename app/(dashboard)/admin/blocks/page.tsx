import { AdminBlocksWorkspace } from "@/components/dashboard/admin-blocks-workspace";
import { adminScheduleBlockRepository } from "@/lib/repositories/admin-schedule-block-repository";

export const metadata = {
  title: "Blocks & Groups",
};

export default async function AdminBlocksPage() {
  const { stats, blockRecords, coachOptions, groupOptions, clientOptions } =
    await adminScheduleBlockRepository.list();

  return (
    <AdminBlocksWorkspace
      stats={stats}
      blockRecords={blockRecords}
      coachOptions={coachOptions}
      groupOptions={groupOptions}
      clientOptions={clientOptions}
    />
  );
}
