import { redirect } from "next/navigation";

import { auth } from "@/auth";
import OpsApp from "@/components/ops/OpsApp";
import { loadOpsData } from "@/lib/ops/bootstrap";
import { initialsOf, type OpsInitial } from "@/lib/ops/live";
import { UserRole } from "@/lib/supabase/domain";

export const dynamic = "force-dynamic";

export default async function OpsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;
  if (role !== UserRole.ADMIN && role !== UserRole.COACH) {
    redirect("/portal-unavailable");
  }

  const data = await loadOpsData();
  const name = session.user.name ?? session.user.email ?? "Marvel Admin";
  const coachId =
    role === UserRole.COACH
      ? (data.coaches.find(
          (coach) =>
            data.coachEmails[coach.id]?.toLowerCase() ===
            session.user.email?.toLowerCase(),
        )?.id ?? null)
      : null;

  const initial: OpsInitial = {
    data,
    self: {
      role: role === UserRole.COACH ? "coach" : "admin",
      coachId,
      name,
      initials: initialsOf(name),
      title: role === UserRole.COACH ? "Coach" : "Admin",
    },
  };

  return <OpsApp initial={initial} />;
}
