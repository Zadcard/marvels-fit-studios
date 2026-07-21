import { AdminTrainingCategoriesWorkspace } from "@/components/dashboard/admin-training-categories-workspace";
import { adminTrainingCategoryRepository } from "@/lib/repositories/admin-training-category-repository";

export const metadata = { title: "Training Categories" };

export default async function AdminTrainingCategoriesPage() {
  const records = await adminTrainingCategoryRepository.list();
  return <AdminTrainingCategoriesWorkspace records={records} />;
}
