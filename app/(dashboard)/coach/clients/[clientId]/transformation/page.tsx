import { UserRole } from "@/lib/supabase/domain";

import { CoachTransformationWorkspace } from "@/components/dashboard/coach-transformation-workspace";
import { requireRole } from "@/lib/auth/session";
import { clientTransformationRepository } from "@/lib/repositories/client-transformation-repository";

export const metadata = {
  title: "Client Transformation",
};

export default async function CoachClientTransformationPage(
  props: PageProps<"/coach/clients/[clientId]/transformation">
) {
  const coach = await requireRole(UserRole.COACH);
  const { clientId } = await props.params;
  const data = await clientTransformationRepository.getForCoach(
    coach.id,
    clientId
  );

  return <CoachTransformationWorkspace data={data} />;
}
