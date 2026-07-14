import { UserRole } from "@/lib/supabase/domain";

import { CoachOverviewWorkspace } from "@/components/dashboard/coach-overview-workspace";
import { requireRole } from "@/lib/auth/session";
import { coachOverviewRepository } from "@/lib/repositories/coach-overview-repository";

export const metadata = {
  title: "Coach Overview",
};

export default async function CoachOverviewPage() {
  const coachUser = await requireRole(UserRole.COACH);
  const data = await coachOverviewRepository.getForCoachUserId(coachUser.id);

  return <CoachOverviewWorkspace data={data} />;
}
