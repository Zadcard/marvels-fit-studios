import { MarvelOpsCoachSchedule } from "@/components/dashboard/marvel-ops-coach-data";
import { requireRole } from "@/lib/auth/session";
import { coachSessionRepository } from "@/lib/repositories/coach-session-repository";
import { UserRole } from "@/lib/supabase/domain";

export const metadata = { title: "Schedule" };

export default async function CoachSchedulePage() {
  const coach = await requireRole(UserRole.COACH);
  return <MarvelOpsCoachSchedule coachName={coach.name ?? "Coach"} sessions={await coachSessionRepository.listForCoachUserId(coach.id)} />;
}
