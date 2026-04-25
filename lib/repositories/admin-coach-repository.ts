import "server-only";

import type {
  AdminCoachRecord,
  AdminCoachSpecialization,
} from "@/lib/mocks/admin-coaches";
import { isPlaceholderCoachName } from "@/lib/coaches/placeholder-coaches";
import { getPrisma, withPrismaFallback } from "@/lib/prisma";

function toAdminCoachSpecialization(
  specialization: "STRENGTH" | "CONDITIONING" | "MOBILITY" | "PRIVATE_COACHING"
): AdminCoachSpecialization {
  switch (specialization) {
    case "CONDITIONING":
      return "Conditioning";
    case "MOBILITY":
      return "Mobility";
    case "PRIVATE_COACHING":
      return "Private Coaching";
    default:
      return "Strength";
  }
}

export class AdminCoachRepository {
  private get prisma() {
    return getPrisma();
  }

  async list(): Promise<AdminCoachRecord[]> {
    return withPrismaFallback(async () => {
      const now = new Date();
      const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const coaches = await this.prisma.coach.findMany({
        orderBy: { fullName: "asc" },
        select: {
          id: true,
          fullName: true,
          phone: true,
          specialization: true,
          user: {
            select: {
              email: true,
            },
          },
          groups: {
            select: {
              type: true,
              _count: {
                select: {
                  clients: true,
                },
              },
            },
          },
          trainingSessions: {
            select: {
              type: true,
              startsAt: true,
              endsAt: true,
            },
          },
        },
      });

      return coaches
        .filter((coach) => !isPlaceholderCoachName(coach.fullName))
        .map((coach) => {
          const activeClients = coach.groups.reduce(
            (total, group) => total + group._count.clients,
            0
          );
          const weeklySessions = coach.trainingSessions.filter(
            (session) => session.startsAt >= now && session.startsAt <= weekEnd
          );
          const sessionsThisWeek = weeklySessions.length;
          const sessionsByDay = new Map<string, number>();

          for (const session of weeklySessions) {
            const day = session.startsAt.toLocaleDateString("en-US", {
              weekday: "short",
            });
            sessionsByDay.set(day, (sessionsByDay.get(day) ?? 0) + 1);
          }

          const conflicts = weeklySessions.reduce((total, session, index) => {
            const overlaps = weeklySessions.some(
              (otherSession, otherIndex) =>
                otherIndex !== index &&
                otherSession.startsAt < session.endsAt &&
                session.startsAt < otherSession.endsAt
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
            email: coach.user.email ?? "No email",
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
