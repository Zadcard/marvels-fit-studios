import { AdminScheduleWorkspace } from "@/components/dashboard/admin-schedule-workspace";
import { adminScheduleRepository } from "@/lib/repositories/admin-schedule-repository";

export const metadata = {
  title: "Schedule Control",
};

function parseWeekStart(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = raw && /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? new Date(`${raw}T12:00:00+03:00`)
    : new Date();

  if (Number.isNaN(parsed.getTime())) return new Date();
  parsed.setHours(12, 0, 0, 0);
  parsed.setDate(parsed.getDate() - ((parsed.getDay() + 6) % 7));
  return parsed;
}

export default async function AdminSchedulePage(
  props: PageProps<"/admin/schedule">,
) {
  const searchParams = await props.searchParams;
  const weekStart = parseWeekStart(searchParams.week);
  const { stats, records, coachOptions, groupOptions } =
    await adminScheduleRepository.getSchedule({ weekStart });

  return (
    <AdminScheduleWorkspace
      stats={stats}
      records={records}
      coachOptions={coachOptions}
      groupOptions={groupOptions}
      weekStartIso={weekStart.toISOString()}
    />
  );
}
