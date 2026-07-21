import "server-only";

import type {
  AdminTrainingCategoryRecord,
  TrainingCategoryOption,
} from "@/lib/dashboard/training-category";
import { withSupabaseFallback } from "@/lib/supabase/errors";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export class AdminTrainingCategoryRepository {
  async list(): Promise<AdminTrainingCategoryRecord[]> {
    return withSupabaseFallback(async () => {
      const { data, error } = await getSupabaseServerClient()
        .from("TrainingCategory")
        .select(
          "id,name,slug,isActive,legacyValue,groups:Group(id,name,isActive),qualifications:CoachTrainingCategory(coach:Coach(id,fullName))",
        )
        .order("name");
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
      }));
    }, []);
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
