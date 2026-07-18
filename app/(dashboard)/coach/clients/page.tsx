import { MarvelOpsCoachClients } from "@/components/dashboard/marvel-ops-coach-data";
import { requireRole } from "@/lib/auth/session";
import { coachClientRepository } from "@/lib/repositories/coach-client-repository";
import { UserRole } from "@/lib/supabase/domain";

export const metadata = { title: "Clients" };

export default async function CoachClientsPage() {
  const coach = await requireRole(UserRole.COACH);
  return <MarvelOpsCoachClients clients={await coachClientRepository.listForCoachUserId(coach.id)} />;
}
