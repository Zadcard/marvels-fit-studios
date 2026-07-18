import { MarvelOpsCoachPhone } from "@/components/dashboard/marvel-ops-coach";
import { requireRole } from "@/lib/auth/session";
import { coachSessionRepository } from "@/lib/repositories/coach-session-repository";
import { UserRole } from "@/lib/supabase/domain";

export const metadata = { title: "On my phone" };

export default async function CoachSessionsPage() {
  const coach = await requireRole(UserRole.COACH);
  const sessions = await coachSessionRepository.listForCoachUserId(coach.id);
  return <MarvelOpsCoachPhone coachName={coach.name ?? "Coach"} sessions={sessions} />;
}
