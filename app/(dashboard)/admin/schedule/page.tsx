import { AdminScheduleWorkspace } from "@/components/dashboard/admin-schedule-workspace";
import {
  getScheduleWeekStart,
  parseScheduleReference,
} from "@/lib/dashboard/schedule-week";
import { adminScheduleRepository } from "@/lib/repositories/admin-schedule-repository";
import { adminSettingsRepository } from "@/lib/repositories/admin-settings-repository";

export const metadata = { title: "Schedule" };

function singleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminSchedulePage(
  props: PageProps<"/admin/schedule">,
) {
  const [searchParams, settings] = await Promise.all([
    props.searchParams,
    adminSettingsRepository.get(),
  ]);
  const reference = parseScheduleReference(singleValue(searchParams.week));
  const weekStart = getScheduleWeekStart(reference, settings.scheduleStartDay);
  const schedule = await adminScheduleRepository.getSchedule({ weekStart });

  return (
    <AdminScheduleWorkspace
      {...schedule}
      weekStartIso={weekStart.toISOString()}
    />
  );
}
