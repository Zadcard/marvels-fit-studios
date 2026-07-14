import { UserRole } from "@/lib/supabase/domain";

import { CoachSessionsWorkspace } from "@/components/dashboard/coach-sessions-workspace";
import { requireRole } from "@/lib/auth/session";
import { coachSessionRepository } from "@/lib/repositories/coach-session-repository";

export const metadata = {
  title: "My Sessions",
};

export default async function CoachSessionsPage() {
  const coachUser = await requireRole(UserRole.COACH);

  const [records, clientOptions] = await Promise.all([
    coachSessionRepository.listForCoachUserId(coachUser.id),
    coachSessionRepository.listClientOptions(),
  ]);

  return <CoachSessionsWorkspace records={records} clientOptions={clientOptions} />;
}
