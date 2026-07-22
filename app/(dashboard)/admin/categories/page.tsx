import { AdminTrainingCategoriesWorkspace } from "@/components/dashboard/admin-training-categories-workspace";
import { adminTrainingCategoryRepository } from "@/lib/repositories/admin-training-category-repository";
import { adminGroupRepository } from "@/lib/repositories/admin-group-repository";

export const metadata = { title: "Programs" };

export default async function AdminTrainingCategoriesPage() {
  const [records, groupData] = await Promise.all([
    adminTrainingCategoryRepository.list(),
    adminGroupRepository.list(),
  ]);
  return <AdminTrainingCategoriesWorkspace records={records} groupRecords={groupData.records} coachOptions={groupData.coachOptions} clientOptions={groupData.clientOptions} categoryOptions={groupData.categoryOptions} />;
}
