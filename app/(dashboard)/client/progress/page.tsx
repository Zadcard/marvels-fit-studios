import { redirect } from "next/navigation";

import { ClientProgressWorkspace } from "@/components/dashboard/client-progress-workspace";
import { requireRole } from "@/lib/auth/session";
import { clientProgressRepository } from "@/lib/repositories/client-progress-repository";
import { UserRole } from "@/lib/supabase/domain";

export const metadata = {
  title: "My Progress",
};

export default async function ClientProgressPage() {
  const user = await requireRole(UserRole.CLIENT);
  const data = await clientProgressRepository.getForClientUser(user.id);

  if (!data) {
    redirect("/login");
  }

  return <ClientProgressWorkspace data={data} />;
}
