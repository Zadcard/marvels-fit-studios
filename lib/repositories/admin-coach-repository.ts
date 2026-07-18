import "server-only";

import type {
  AdminCoachRecord,
  AdminCoachSpecialization,
} from "@/lib/mocks/admin-coaches";
import type { Database } from "@/lib/supabase/database.types";
import { withSupabaseFallback } from "@/lib/supabase/errors";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function toAdminCoachSpecialization(
  specialization: Database["public"]["Enums"]["CoachSpecialization"]
): AdminCoachSpecialization {
  switch (specialization) {
    case "CONDITIONING":
      return "Conditioning";
    case "MOBILITY":
      return "Mobility";
    case "PRIVATE_COACHING":
      return "Private Coaching";
    case "FOOTBALL":
      return "Football";
    case "TENNIS":
      return "Tennis";
    case "CALISTHENICS":
      return "Calisthenics";
    case "REHAB":
      return "Rehab";
    case "ATHLETIC_PERFORMANCE":
      return "Athletic Performance";
    case "GENERAL_FITNESS":
      return "General Fitness";
    default:
      return "Strength";
  }
}

export class AdminCoachRepository {
  async list(): Promise<AdminCoachRecord[]> {
    return withSupabaseFallback(async () => {
      const now = new Date();
      const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const { data: coaches, error } = await getSupabaseServerClient()
        .from("Coach")
        .select(
          "id,fullName,phone,specialization,user:User(email),groups:Group(type,clients:Client(id)),trainingSessions:TrainingSession(type,startsAt,endsAt)"
        )
        .order("fullName");
      if (error) throw error;

      return coaches
        .filter(
          (coach) => coach.user?.email?.toLowerCase() !== "coach@test.com",
        )
        .map((coach) => {
          const activeClients = coach.groups.reduce(
            (total, group) => total + group.clients.length,
            0
          );
          const weeklySessions = coach.trainingSessions.filter(
            (session) =>
              new Date(session.startsAt) >= now &&
              new Date(session.startsAt) <= weekEnd
          );
          const sessionsThisWeek = weeklySessions.length;
          const sessionsByDay = new Map<string, number>();

          for (const session of weeklySessions) {
            const day = new Date(session.startsAt).toLocaleDateString("en-US", {
              weekday: "short",
            });
            sessionsByDay.set(day, (sessionsByDay.get(day) ?? 0) + 1);
          }

          const conflicts = weeklySessions.reduce((total, session, index) => {
            const overlaps = weeklySessions.some(
              (otherSession, otherIndex) =>
                otherIndex !== index &&
                new Date(otherSession.startsAt) < new Date(session.endsAt) &&
                new Date(session.startsAt) < new Date(otherSession.endsAt)
            );
            return total + (overlaps ? 1 : 0);
          }, 0);
          const openSlots = Math.max(0, 12 - sessionsThisWeek);

          return {
            id: coach.id,
            fullName: coach.fullName,
            specialization: toAdminCoachSpecialization(coach.specialization),
            activeClients,
            sessionsThisWeek,
            conflicts,
            openSlots,
            weeklyLoad: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
              (day) => ({
                day,
                sessions: sessionsByDay.get(day) ?? 0,
              })
            ),
            email: coach.user?.email ?? "No email",
            phone: coach.phone ?? "No phone",
            summary:
              activeClients > 0
                ? `${coach.fullName} is currently supporting ${activeClients} client${activeClients === 1 ? "" : "s"}.`
                : `${coach.fullName} has no assigned clients yet.`,
          };
        });
    }, []);
  }
}

export const adminCoachRepository = new AdminCoachRepository();
