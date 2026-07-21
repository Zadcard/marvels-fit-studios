import "server-only";

import type {
  AdminCoachRecord,
  AdminCoachSpecialization,
} from "@/lib/dashboard/admin-coach-record";
import type { TrainingCategoryOption } from "@/lib/dashboard/training-category";
import type { Database } from "@/lib/supabase/database.types";
import { withSupabaseFallback } from "@/lib/supabase/errors";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getStudioDateKey, getStudioDayRange } from "@/lib/time/studio-time";

function toSpecialization(
  value: Database["public"]["Enums"]["CoachSpecialization"],
): AdminCoachSpecialization {
  const labels: Record<Database["public"]["Enums"]["CoachSpecialization"], AdminCoachSpecialization> = {
    STRENGTH: "Strength",
    CONDITIONING: "Conditioning",
    MOBILITY: "Mobility",
    PRIVATE_COACHING: "Private Coaching",
    FOOTBALL: "Football",
    TENNIS: "Tennis",
    CALISTHENICS: "Calisthenics",
    REHAB: "Rehab",
    ATHLETIC_PERFORMANCE: "Athletic Performance",
    GENERAL_FITNESS: "General Fitness",
  };
  return labels[value];
}

export class AdminCoachRepository {
  async list(): Promise<{ records: AdminCoachRecord[]; categoryOptions: TrainingCategoryOption[] }> {
    const supabase = getSupabaseServerClient();
    const now = new Date();
    const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const today = getStudioDayRange(getStudioDateKey(now));

    const [records, categoryOptions] = await Promise.all([
      withSupabaseFallback<AdminCoachRecord[]>(async () => {
        const { data, error } = await supabase
          .from("Coach")
          .select("id,fullName,phone,specialization,user:User(email),groups:Group(id,name,isActive,categoryId,category:TrainingCategory(name),clients:Client(id)),qualifications:CoachTrainingCategory(category:TrainingCategory(id,name,slug,isActive)),trainingSessions:TrainingSession(startsAt)")
          .order("fullName");
        if (error) throw error;

        return data
          .filter((coach) => coach.user?.email?.toLowerCase() !== "coach@test.com")
          .map((coach) => {
            const weekly = coach.trainingSessions.filter((session) => {
              const startsAt = new Date(session.startsAt);
              return startsAt >= now && startsAt <= weekEnd;
            });
            const sessionsByDay = new Map<string, number>();
            for (const session of weekly) {
              const day = new Date(session.startsAt).toLocaleDateString("en-US", { weekday: "short" });
              sessionsByDay.set(day, (sessionsByDay.get(day) ?? 0) + 1);
            }
            const assignedGroups = coach.groups.map((group) => ({
              id: group.id,
              name: group.name,
              categoryId: group.categoryId,
              categoryName: group.category?.name ?? "Unknown category",
            }));
            const activeGroups = coach.groups.filter((group) => group.isActive);
            const activeClients = activeGroups.reduce((total, group) => total + group.clients.length, 0);
            return {
              id: coach.id,
              fullName: coach.fullName,
              specialization: toSpecialization(coach.specialization),
              qualifiedCategories: coach.qualifications
                .map((item) => item.category)
                .filter((category): category is NonNullable<typeof category> => Boolean(category))
                .sort((a, b) => a.name.localeCompare(b.name)),
              assignedGroups,
              activeClients,
              activeGroups: activeGroups.length,
              sessionsToday: coach.trainingSessions.filter((session) => session.startsAt >= today.start && session.startsAt < today.endExclusive).length,
              sessionsThisWeek: weekly.length,
              conflicts: 0,
              weeklyLoad: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => ({ day, sessions: sessionsByDay.get(day) ?? 0 })),
              email: coach.user?.email ?? "No email",
              phone: coach.phone ?? "",
              summary: assignedGroups.length
                ? `Assigned to ${assignedGroups.length} group${assignedGroups.length === 1 ? "" : "s"}.`
                : "No assigned groups yet.",
            };
          });
      }, []),
      withSupabaseFallback<TrainingCategoryOption[]>(async () => {
        const { data, error } = await supabase.from("TrainingCategory").select("id,name,slug,isActive").order("name");
        if (error) throw error;
        return data;
      }, []),
    ]);

    return { records, categoryOptions };
  }
}

export const adminCoachRepository = new AdminCoachRepository();
