import { AdminScheduleWorkspace } from "@/components/dashboard/admin-schedule-workspace";
import { adminScheduleRepository } from "@/lib/repositories/admin-schedule-repository";

export const metadata = {
  title: "Schedule Control",
};

export default async function AdminSchedulePage() {
  const { stats, records, coachOptions, groupOptions } =
    await adminScheduleRepository.getSchedule();

  return (
    <AdminScheduleWorkspace
      stats={stats}
      records={records}
      coachOptions={coachOptions}
      groupOptions={groupOptions}
    />
  );
}
