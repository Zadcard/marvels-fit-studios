import { AdminScheduleWorkspace } from "@/components/dashboard/admin-schedule-workspace";
import { parseDurationMinutes } from "@/lib/dashboard/duration-label";
import {
  getScheduleWeekStart,
  parseScheduleReference,
} from "@/lib/dashboard/schedule-week";
import { adminScheduleRepository } from "@/lib/repositories/admin-schedule-repository";
import { adminSettingsRepository } from "@/lib/repositories/admin-settings-repository";
import { recurringSessionRepository } from "@/lib/repositories/recurring-session-repository";

const DEFAULT_SESSION_MINUTES = 60;

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
  const [schedule, recurring] = await Promise.all([
    adminScheduleRepository.getSchedule({ weekStart }),
    recurringSessionRepository.list(),
  ]);

  return (
    <AdminScheduleWorkspace
      {...schedule}
      recurringTemplates={recurring.templates}
      weekStartDate={weekStart}
      defaultDurationMinutes={
        parseDurationMinutes(settings.defaultSessionLength) ??
        DEFAULT_SESSION_MINUTES
      }
      cancellationWindowMinutes={parseDurationMinutes(settings.cancellationWindow) ?? 0}
    />
  );
}
