import "server-only";

import type {
  AdminTrainingCategoryRecord,
  TrainingCategoryOption,
} from "@/lib/dashboard/training-category";
import { getSupervisedCategoryIdsForUserId } from "@/lib/auth/category-access";
import { withSupabaseFallback } from "@/lib/supabase/errors";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export class AdminTrainingCategoryRepository {
  async list(categoryIds?: readonly string[]): Promise<AdminTrainingCategoryRecord[]> {
    if (categoryIds && categoryIds.length === 0) return [];
    return withSupabaseFallback(async () => {
      let query = getSupabaseServerClient()
        .from("TrainingCategory")
        .select(
          "id,name,slug,isActive,legacyValue,groups:Group(id,name,isActive),qualifications:CoachTrainingCategory(coach:Coach(id,fullName)),supervisorLinks:CategorySupervisor(coach:Coach(id,fullName))",
        );
      if (categoryIds) query = query.in("id", [...categoryIds]);
      const { data, error } = await query.order("name");
      if (error) throw error;

      return data.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        isActive: category.isActive,
        legacyValue: category.legacyValue,
        groups: category.groups
          .map((group) => ({ id: group.id, name: group.name, isActive: group.isActive }))
          .sort((left, right) => left.name.localeCompare(right.name)),
        coaches: category.qualifications
          .map((qualification) => qualification.coach)
          .filter((coach): coach is NonNullable<typeof coach> => Boolean(coach))
          .map((coach) => ({ id: coach.id, name: coach.fullName }))
          .sort((left, right) => left.name.localeCompare(right.name)),
        supervisors: category.supervisorLinks
          .map((link) => link.coach)
          .filter((coach): coach is NonNullable<typeof coach> => Boolean(coach))
          .map((coach) => ({ id: coach.id, name: coach.fullName }))
          .sort((left, right) => left.name.localeCompare(right.name)),
      }));
    }, []);
  }

  async listForSupervisorUserId(userId: string): Promise<AdminTrainingCategoryRecord[]> {
    const categoryIds = await getSupervisedCategoryIdsForUserId(userId);
    return this.list(categoryIds);
  }

  async options({ activeOnly = false }: { activeOnly?: boolean } = {}): Promise<TrainingCategoryOption[]> {
    return withSupabaseFallback(async () => {
      let query = getSupabaseServerClient()
        .from("TrainingCategory")
        .select("id,name,slug,isActive")
        .order("name");
      if (activeOnly) query = query.eq("isActive", true);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }, []);
  }
}

export const adminTrainingCategoryRepository = new AdminTrainingCategoryRepository();
