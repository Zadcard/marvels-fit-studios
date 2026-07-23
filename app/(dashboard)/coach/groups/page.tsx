import { AdminGroupsWorkspace } from "@/components/dashboard/admin-groups-workspace";
import { getCoachIdForUserId } from "@/lib/auth/category-access";
import { requireRole } from "@/lib/auth/session";
import { adminGroupRepository } from "@/lib/repositories/admin-group-repository";
import { UserRole } from "@/lib/supabase/domain";

export const metadata = { title: "My Groups" };

export default async function CoachGroupsPage() {
  const user = await requireRole(UserRole.COACH);
  const coachId = await getCoachIdForUserId(user.id);
  const { records, coachOptions, clientOptions, categoryOptions } = await adminGroupRepository.list();

  return (
    <AdminGroupsWorkspace
      mode="owner"
      records={records.filter((group) => group.coachId === coachId)}
      coachOptions={coachOptions}
      clientOptions={clientOptions}
      categoryOptions={categoryOptions}
    />
  );
}
