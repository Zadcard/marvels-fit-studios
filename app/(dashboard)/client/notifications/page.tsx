import { NotificationWorkspace } from "@/components/dashboard/notification-workspace";
import { requireRole } from "@/lib/auth/session";
import { listNotifications } from "@/lib/repositories/notification-repository";
import { UserRole } from "@/lib/supabase/domain";
export const metadata = { title: "Notifications" };
export default async function Page() { const user = await requireRole(UserRole.CLIENT); return <NotificationWorkspace notifications={await listNotifications(user.id)} />; }
