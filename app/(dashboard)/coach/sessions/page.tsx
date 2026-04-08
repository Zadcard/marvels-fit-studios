import { UserRole } from "@prisma/client";

import { CoachSessionsWorkspace } from "@/components/dashboard/coach-sessions-workspace";
import { requireRole } from "@/lib/auth/session";
import { coachSessionRepository } from "@/lib/repositories/coach-session-repository";

export const metadata = {
  title: "My Sessions",
};

export default async function CoachSessionsPage() {
  const coachUser = await requireRole(UserRole.COACH);

  const records = await coachSessionRepository.listForCoachUserId(coachUser.id);

  return <CoachSessionsWorkspace records={records} />;
}
