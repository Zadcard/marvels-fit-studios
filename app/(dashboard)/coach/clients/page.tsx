import { UserRole } from "@prisma/client";

import { CoachClientsWorkspace } from "@/components/dashboard/coach-clients-workspace";
import { requireRole } from "@/lib/auth/session";
import { coachClientRepository } from "@/lib/repositories/coach-client-repository";

export const metadata = {
  title: "Assigned Clients",
};

export default async function CoachClientsPage() {
  const coachUser = await requireRole(UserRole.COACH);

  const records = await coachClientRepository.listForCoachUserId(coachUser.id);

  return <CoachClientsWorkspace records={records} />;
}
