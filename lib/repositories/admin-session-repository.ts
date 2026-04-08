import "server-only";

import type {
  AdminGroupSessionRecord,
  AdminPrivateSessionRecord,
  AdminSessionStatus,
} from "@/lib/mocks/admin-sessions";
import { getPrisma } from "@/lib/prisma";

const dayFormatter = new Intl.DateTimeFormat("en-US", { weekday: "short" });
const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

function getDayLabel(date: Date) {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  if (date.toDateString() === now.toDateString()) {
    return "Today";
  }

  if (date.toDateString() === tomorrow.toDateString()) {
    return "Tomorrow";
  }

  return dayFormatter.format(date);
}

function mapStatus(
  status: "DRAFT" | "SCHEDULED" | "COMPLETED" | "CANCELED",
  isAtCapacity: boolean
): AdminSessionStatus {
  if (status === "DRAFT") {
    return "Draft";
  }

  if (status === "COMPLETED") {
    return "Completed";
  }

  if (isAtCapacity) {
    return "Waitlist";
  }

  return "Scheduled";
}

export class AdminSessionRepository {
  private prisma = getPrisma();

  async list(): Promise<{
    groupRecords: AdminGroupSessionRecord[];
    privateRecords: AdminPrivateSessionRecord[];
  }> {
    const sessions = await this.prisma.trainingSession.findMany({
      orderBy: [{ startsAt: "asc" }],
      select: {
        id: true,
        title: true,
        startsAt: true,
        location: true,
        status: true,
        type: true,
        capacity: true,
        coach: {
          select: {
            fullName: true,
          },
        },
        bookings: {
          where: {
            status: {
              in: ["BOOKED", "ATTENDED", "WAITLIST"],
            },
          },
          select: {
            client: {
              select: {
                fullName: true,
              },
            },
          },
        },
        notes: {
          orderBy: [{ createdAt: "desc" }],
          take: 1,
          select: {
            content: true,
          },
        },
      },
    });

    const groupRecords: AdminGroupSessionRecord[] = [];
    const privateRecords: AdminPrivateSessionRecord[] = [];

    for (const session of sessions) {
      const enrolled = session.bookings.length;
      const isAtCapacity =
        session.capacity !== null && session.capacity > 0 && enrolled >= session.capacity;
      const baseRecord = {
        id: session.id,
        title: session.title,
        coachName: session.coach.fullName,
        dayLabel: getDayLabel(session.startsAt),
        timeLabel: timeFormatter.format(session.startsAt),
        location: session.location ?? "Studio floor",
        status: mapStatus(session.status, isAtCapacity),
      };

      if (session.type === "PRIVATE") {
        privateRecords.push({
          ...baseRecord,
          clientName: session.bookings[0]?.client.fullName ?? "Unassigned",
          focus: session.notes[0]?.content ?? "Private coaching block",
        });
      } else {
        groupRecords.push({
          ...baseRecord,
          capacity: session.capacity ?? Math.max(enrolled, 1),
          enrolled,
        });
      }
    }

    return { groupRecords, privateRecords };
  }
}

export const adminSessionRepository = new AdminSessionRepository();
