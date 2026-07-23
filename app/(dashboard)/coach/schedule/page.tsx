import { CoachScheduleWorkspace } from "@/components/dashboard/coach-schedule-workspace";
import { getCoachIdForUserId, getSupervisedCategoryIdsForUserId } from "@/lib/auth/category-access";
import { requireRole } from "@/lib/auth/session";
import {
  getScheduleWeekStart,
  parseScheduleReference,
} from "@/lib/dashboard/schedule-week";
import { adminScheduleRepository } from "@/lib/repositories/admin-schedule-repository";
import { adminSettingsRepository } from "@/lib/repositories/admin-settings-repository";
import { UserRole } from "@/lib/supabase/domain";

export const metadata = { title: "Schedule" };

function singleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CoachSchedulePage(
  props: PageProps<"/coach/schedule">,
) {
  const [user, searchParams, settings] = await Promise.all([
    requireRole(UserRole.COACH),
    props.searchParams,
    adminSettingsRepository.get(),
  ]);
  const coachId = await getCoachIdForUserId(user.id);
  const supervisedCategoryIds = coachId
    ? await getSupervisedCategoryIdsForUserId(user.id)
    : [];
  const isSupervisor = supervisedCategoryIds.length > 0;

  const reference = parseScheduleReference(singleValue(searchParams.week));
  const weekStart = getScheduleWeekStart(reference, settings.scheduleStartDay);
  const schedule = coachId
    ? await adminScheduleRepository.getSchedule({
        weekStart,
        scope: { coachId, categoryIds: supervisedCategoryIds },
      })
    : { stats: [], records: [], coachOptions: [], groupOptions: [], clientOptions: [] };

  return (
    <CoachScheduleWorkspace
      stats={schedule.stats}
      records={schedule.records}
      weekStartDate={weekStart}
      isSupervisor={isSupervisor}
      coachName={user.name ?? "Coach"}
    />
  );
}
