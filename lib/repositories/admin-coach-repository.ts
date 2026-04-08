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

    const coachMetaRows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        specialization:
          | "STRENGTH"
          | "CONDITIONING"
          | "MOBILITY"
          | "PRIVATE_COACHING";
      }>
    >`SELECT "id", "specialization" FROM "Coach"`;

    const coachMeta = new Map(
      coachMetaRows.map((row) => [
        row.id,
        {
          specialization: row.specialization,
        },
      ])
    );

    return coaches.map((coach) => {
      const activeClients = coach.groups.reduce(
        (total, group) => total + group._count.clients,
        0
      );
      const sessionsThisWeek = coach.trainingSessions.filter(
        (session) => session.startsAt >= now && session.startsAt <= weekEnd
      ).length;
      const meta = coachMeta.get(coach.id);

      return {
        id: coach.id,
        fullName: coach.fullName,
        specialization: toAdminCoachSpecialization(
          meta?.specialization ?? "STRENGTH"
        ),
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
