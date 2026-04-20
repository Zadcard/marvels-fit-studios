import "server-only";

import type {
  AdminCoachRecord,
  AdminCoachSpecialization,
} from "@/lib/mocks/admin-coaches";
import { getPrisma } from "@/lib/prisma";

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
  private prisma = getPrisma();

  async list(): Promise<AdminCoachRecord[]> {
    const now = new Date();
    const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const scheduleBlockDelegate = this.prisma.scheduleBlock as
      | typeof this.prisma.scheduleBlock
      | undefined;

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

    const scheduleBlocks = scheduleBlockDelegate
      ? await scheduleBlockDelegate.findMany({
          where: {
            status: {
              in: ["ACTIVE", "PAUSED"],
            },
          },
          select: {
            id: true,
            coachId: true,
            title: true,
            recurrenceDays: true,
            roster: {
              select: {
                clientId: true,
              },
            },
          },
        })
      : [];

    const blocksByCoachId = new Map<string, typeof scheduleBlocks>();

    for (const block of scheduleBlocks) {
      const existingBlocks = blocksByCoachId.get(block.coachId) ?? [];
      existingBlocks.push(block);
      blocksByCoachId.set(block.coachId, existingBlocks);
    }

    return coaches.map((coach) => {
      const coachScheduleBlocks = blocksByCoachId.get(coach.id) ?? [];
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
        recurringBlocks: coachScheduleBlocks.length,
        conflicts,
        openSlots,
        weeklyLoad: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
          (day) => ({
            day,
            sessions: sessionsByDay.get(day) ?? 0,
          })
        ),
        blockAssignments: coachScheduleBlocks.map((block) => ({
          id: block.id,
          title: block.title,
          recurrenceSummary: block.recurrenceDays
            .map((day) => `${day.charAt(0)}${day.slice(1).toLowerCase()}`)
            .join(", "),
          rosterCount: block.roster.length,
        })),
        email: coach.user.email ?? "No email",
        phone: coach.phone ?? "No phone",
        summary:
          activeClients > 0
            ? `${coach.fullName} is currently supporting ${activeClients} client${activeClients === 1 ? "" : "s"} across ${coachScheduleBlocks.length} recurring block${coachScheduleBlocks.length === 1 ? "" : "s"}.`
            : `${coach.fullName} has no assigned clients yet.`,
      };
    });
  }
}

export const adminCoachRepository = new AdminCoachRepository();
