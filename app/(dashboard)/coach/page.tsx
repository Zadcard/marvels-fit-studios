import { MarvelOpsCoachToday } from "@/components/dashboard/marvel-ops-coach";
import { requireRole } from "@/lib/auth/session";
import { coachSessionRepository } from "@/lib/repositories/coach-session-repository";
import { UserRole } from "@/lib/supabase/domain";

export const metadata = { title: "Today's sessions" };

export default async function CoachOverviewPage() {
  const coach = await requireRole(UserRole.COACH);
  const sessions = await coachSessionRepository.listForCoachUserId(coach.id);
  return <MarvelOpsCoachToday coachName={coach.name ?? "Coach"} sessions={sessions} />;
}
