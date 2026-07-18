import { CoachSessionWorkspace } from "@/components/dashboard/coach-session-workspace";
import { requireRole } from "@/lib/auth/session";
import { coachClientRepository } from "@/lib/repositories/coach-client-repository";
import { coachSessionRepository } from "@/lib/repositories/coach-session-repository";
import { UserRole } from "@/lib/supabase/domain";

export const metadata = { title: "Sessions" };

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CoachSessionsPage(props: PageProps<"/coach/sessions">) {
  const searchParams = await props.searchParams;
  const coach = await requireRole(UserRole.COACH);
  const [sessions, clients] = await Promise.all([
    coachSessionRepository.listForCoachUserId(coach.id),
    coachClientRepository.listForCoachUserId(coach.id),
  ]);
  return <CoachSessionWorkspace sessions={sessions} clientOptions={clients.map(({ id, fullName }) => ({ id, fullName }))} initialSessionId={getSingleValue(searchParams.session)} />;
}
