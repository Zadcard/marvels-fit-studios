import "server-only";

import type {
  AdminCoachRecord,
  AdminCoachSpecialization,
  AdminCoachStatus,
} from "@/lib/mocks/admin-coaches";
import { getPrisma } from "@/lib/prisma";

function inferSpecialization(record: {
  groups: Array<{ type: "GROUP" | "PRIVATE" }>;
  trainingSessions: Array<{ type: "GROUP" | "PRIVATE" }>;
}): AdminCoachSpecialization {
  const privateCount =
    record.groups.filter((group) => group.type === "PRIVATE").length +
    record.trainingSessions.filter((session) => session.type === "PRIVATE").length;

  if (privateCount > 0) {
    return "Private Coaching";
  }

  if (record.trainingSessions.length >= 3) {
    return "Conditioning";
  }

  return "Strength";
}

function inferStatus(activeClients: number, sessionsThisWeek: number): AdminCoachStatus {
  if (activeClients === 0 && sessionsThisWeek === 0) {
    return "Away";
  }

  if (sessionsThisWeek <= 1) {
    return "Limited";
  }

  return "Active";
}

export class AdminCoachRepository {
  private prisma = getPrisma();

  async list(): Promise<AdminCoachRecord[]> {
    const now = new Date();
    const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const coaches = await this.prisma.coach.findMany({
      orderBy: { fullName: "asc" },
      select: {
        id: true,
        fullName: true,
        phone: true,
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
          },
        },
      },
    });

    return coaches.map((coach) => {
      const activeClients = coach.groups.reduce(
        (total, group) => total + group._count.clients,
        0
      );
      const sessionsThisWeek = coach.trainingSessions.filter(
        (session) => session.startsAt >= now && session.startsAt <= weekEnd
      ).length;

      return {
        id: coach.id,
        fullName: coach.fullName,
        specialization: inferSpecialization(coach),
        status: inferStatus(activeClients, sessionsThisWeek),
        activeClients,
        sessionsThisWeek,
        email: coach.user.email ?? "No email",
        phone: coach.phone ?? "No phone",
        summary:
          activeClients > 0
            ? `${coach.fullName} is currently supporting ${activeClients} client${activeClients === 1 ? "" : "s"}.`
            : `${coach.fullName} has no assigned clients yet.`,
      };
    });
  }
}

export const adminCoachRepository = new AdminCoachRepository();
