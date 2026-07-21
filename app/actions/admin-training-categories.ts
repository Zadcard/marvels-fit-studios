"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import { requireCategoryWriteAccess } from "@/lib/auth/category-access";
import { slugifyTrainingCategory } from "@/lib/dashboard/training-category";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { UserRole } from "@/lib/supabase/domain";
import {
  deleteTrainingCategorySchema,
  saveTrainingCategorySchema,
} from "@/lib/validators/training-category";

function revalidateCategoryViews() {
  revalidatePath("/admin/categories");
  revalidatePath("/admin/coaches");
  revalidatePath("/admin/schedule");
  revalidatePath("/coach/categories");
}

export async function saveTrainingCategory(input: {
  categoryId?: string | null;
  name: string;
  isActive: boolean;
}) {
  const parsed = saveTrainingCategorySchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid category.");

  const name = parsed.data.name;
  const slug = slugifyTrainingCategory(name);
  if (!slug) throw new Error("Category name must contain letters or numbers.");

  const supabase = getSupabaseServerClient();
  let result;
  if (parsed.data.categoryId) {
    const access = await requireCategoryWriteAccess(parsed.data.categoryId);
    result = await supabase
        .from("TrainingCategory")
        .update({
          name,
          slug,
          ...(access.role === UserRole.ADMIN ? { isActive: parsed.data.isActive } : {}),
          updatedAt: new Date().toISOString(),
        })
        .eq("id", parsed.data.categoryId)
        .select("id")
        .single();
  } else {
    await requireRole(UserRole.ADMIN);
    result = await supabase
        .from("TrainingCategory")
        .insert({ name, slug, isActive: parsed.data.isActive })
        .select("id")
        .single();
  }

  if (result.error?.code === "23505") throw new Error("A category with this name already exists.");
  if (result.error) throw result.error;
  revalidateCategoryViews();
  return result.data;
}

export async function setTrainingCategorySupervisors(categoryId: string, coachIds: string[]) {
  await requireRole(UserRole.ADMIN);
  const parsedCategoryId = saveTrainingCategorySchema.shape.categoryId.safeParse(categoryId);
  if (!parsedCategoryId.success || !parsedCategoryId.data) throw new Error("Invalid category.");
  const parsedCoachIds = coachIds.map((coachId) => {
    const parsed = saveTrainingCategorySchema.shape.categoryId.safeParse(coachId);
    if (!parsed.success || !parsed.data) throw new Error("Invalid supervisor.");
    return parsed.data;
  });
  const { error } = await getSupabaseServerClient().rpc("set_category_supervisors", {
    p_category_id: parsedCategoryId.data,
    p_coach_ids: [...new Set(parsedCoachIds)],
  });
  if (error) throw error;
  revalidateCategoryViews();
}

export async function setTrainingCategoryActive(categoryId: string, isActive: boolean) {
  await requireRole(UserRole.ADMIN);
  const parsed = saveTrainingCategorySchema.shape.categoryId.safeParse(categoryId);
  if (!parsed.success || !parsed.data) throw new Error("Invalid category.");
  const { error } = await getSupabaseServerClient()
    .from("TrainingCategory")
    .update({ isActive, updatedAt: new Date().toISOString() })
    .eq("id", parsed.data);
  if (error) throw error;
  revalidateCategoryViews();
}

export async function deleteTrainingCategory(input: {
  categoryId: string;
  confirmationText: string;
}) {
  await requireRole(UserRole.ADMIN);
  const parsed = deleteTrainingCategorySchema.safeParse(input);
  if (!parsed.success) throw new Error('Type "Delete" to confirm category deletion.');
  const { error } = await getSupabaseServerClient()
    .from("TrainingCategory")
    .delete()
    .eq("id", parsed.data.categoryId);
  if (error?.code === "23503") {
    throw new Error("Referenced categories cannot be deleted. Archive the category instead.");
  }
  if (error) throw error;
  revalidateCategoryViews();
}
