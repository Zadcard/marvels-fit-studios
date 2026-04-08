import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { CoachClientsWorkspace } from "@/components/dashboard/coach-clients-workspace";
import { coachClientRepository } from "@/lib/repositories/coach-client-repository";

export const metadata = {
  title: "Assigned Clients",
};

export default async function CoachClientsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const records = await coachClientRepository.listForCoachUserId(session.user.id);

  return <CoachClientsWorkspace records={records} />;
}
