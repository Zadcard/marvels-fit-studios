import { redirect } from "next/navigation";
import { UserRole } from "@/lib/supabase/domain";

import { ClientCoachWorkspace } from "@/components/dashboard/client-coach-workspace";
import { requireRole } from "@/lib/auth/session";
import { clientDashboardRepository } from "@/lib/repositories/client-dashboard-repository";

export const metadata = {
  title: "My Coach",
};

export default async function ClientCoachPage() {
  let user;

  try {
    user = await requireRole(UserRole.CLIENT);
  } catch {
    redirect("/login");
  }

  const data = await clientDashboardRepository.getCoach(user.id);

  if (!data) {
    redirect("/login");
  }

  return <ClientCoachWorkspace data={data} />;
}
