import { MarvelOpsCoachClients } from "@/components/dashboard/marvel-ops-coach-data";
import { requireRole } from "@/lib/auth/session";
import { coachClientRepository } from "@/lib/repositories/coach-client-repository";
import { UserRole } from "@/lib/supabase/domain";

export const metadata = { title: "Clients" };

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CoachClientsPage(
  props: PageProps<"/coach/clients">,
) {
  const searchParams = await props.searchParams;
  const initialClientId = getSingleValue(searchParams.client) ?? null;
  const coach = await requireRole(UserRole.COACH);
  return (
    <MarvelOpsCoachClients
      clients={await coachClientRepository.listForCoachUserId(coach.id)}
      initialClientId={initialClientId}
    />
  );
}
