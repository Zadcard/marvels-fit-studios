import { MarvelOpsNotifications } from "@/components/dashboard/marvel-ops-notifications";
import { requireUser } from "@/lib/auth/session";
import { listNotifications } from "@/lib/repositories/notification-repository";

export const metadata = { title: "Notifications" };

export default async function AdminNotificationsPage() {
  const user = await requireUser();
  return <MarvelOpsNotifications role="admin" items={await listNotifications(user.id)} />;
}
