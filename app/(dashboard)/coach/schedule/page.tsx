import { UserRole } from "@/lib/supabase/domain";

import { CoachScheduleWorkspace } from "@/components/dashboard/coach-schedule-workspace";
import { requireRole } from "@/lib/auth/session";
import { coachSessionRepository } from "@/lib/repositories/coach-session-repository";

export const metadata = {
  title: "My Schedule",
};

export default async function CoachSchedulePage() {
  const coachUser = await requireRole(UserRole.COACH);
  const records = await coachSessionRepository.listScheduleForCoachUserId(
    coachUser.id
  );

  return <CoachScheduleWorkspace records={records} />;
}
