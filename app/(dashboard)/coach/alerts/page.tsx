import { MarvelOpsNotifications } from "@/components/dashboard/marvel-ops-notifications";
import { requireRole } from "@/lib/auth/session";
import { listNotifications } from "@/lib/repositories/notification-repository";
import { UserRole } from "@/lib/supabase/domain";

export const metadata = { title: "Alerts" };

export default async function CoachAlertsPage() {
  const coach = await requireRole(UserRole.COACH);
  return <MarvelOpsNotifications items={await listNotifications(coach.id)} />;
}
