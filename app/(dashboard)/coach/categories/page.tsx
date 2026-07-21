import { AdminTrainingCategoriesWorkspace } from "@/components/dashboard/admin-training-categories-workspace";
import { requireRole } from "@/lib/auth/session";
import { getSupervisedCategoryIdsForUserId } from "@/lib/auth/category-access";
import { adminGroupRepository } from "@/lib/repositories/admin-group-repository";
import { adminTrainingCategoryRepository } from "@/lib/repositories/admin-training-category-repository";
import { UserRole } from "@/lib/supabase/domain";

export const metadata = { title: "Supervised categories" };

export default async function CoachCategoriesPage() {
  const user = await requireRole(UserRole.COACH);
  const categoryIds = await getSupervisedCategoryIdsForUserId(user.id);
  const [records, groupData] = await Promise.all([
    adminTrainingCategoryRepository.list(categoryIds),
    adminGroupRepository.list({ categoryIds }),
  ]);

  return <AdminTrainingCategoriesWorkspace mode="supervisor" records={records} groupRecords={groupData.records} coachOptions={groupData.coachOptions} clientOptions={groupData.clientOptions} categoryOptions={groupData.categoryOptions} />;
}
