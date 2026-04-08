import "server-only";

import type {
  CoachSessionBookingRecord,
  CoachSessionRecord,
  CoachSessionStatus,
} from "@/lib/dashboard/coach-session-data";
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

function mapSessionStatus(input: {
  startsAt: Date;
  status: "DRAFT" | "SCHEDULED" | "COMPLETED" | "CANCELED";
  bookings: Array<{ status: "BOOKED" | "ATTENDED" | "MISSED" | "CANCELED" | "WAITLIST" }>;
}): CoachSessionStatus {
  if (input.status === "COMPLETED") {
    return "Completed";
  }

  if (input.bookings.some((booking) => booking.status === "WAITLIST")) {
    return "Waitlist";
  }

  if (input.startsAt.getTime() <= Date.now() + 60 * 60 * 1000) {
    return "Ready";
  }

  return "Prep";
}

function mapBookingStatus(
  status: "BOOKED" | "ATTENDED" | "MISSED" | "CANCELED" | "WAITLIST"
): CoachSessionBookingRecord["status"] | null {
  switch (status) {
    case "ATTENDED":
      return "Attended";
    case "MISSED":
      return "Missed";
    case "WAITLIST":
      return "Waitlist";
    case "BOOKED":
      return "Booked";
    default:
      return null;
  }
}

export class CoachSessionRepository {
  private prisma = getPrisma();

  async listForCoachUserId(userId: string): Promise<CoachSessionRecord[]> {
    const sessions = await this.prisma.trainingSession.findMany({
      where: {
        coach: {
          userId,
        },
      },
      orderBy: [{ startsAt: "asc" }],
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        status: true,
        startsAt: true,
        location: true,
        capacity: true,
        notes: {
          orderBy: [{ createdAt: "desc" }],
          take: 1,
          select: {
            content: true,
          },
        },
        bookings: {
          where: {
            status: {
              in: ["BOOKED", "ATTENDED", "MISSED", "WAITLIST"],
            },
          },
          orderBy: [{ bookedAt: "asc" }],
          select: {
            status: true,
            client: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
      },
    });

    return sessions.map((session) => {
      const bookings = session.bookings
        .map((booking) => {
          const status = mapBookingStatus(booking.status);

          if (!status) {
            return null;
          }

          return {
            clientId: booking.client.id,
            fullName: booking.client.fullName,
            status,
          };
        })
        .filter((booking): booking is CoachSessionBookingRecord => booking !== null);

      const rosterLabel =
        session.type === "PRIVATE"
          ? bookings[0]?.fullName ?? "No client assigned"
          : `${bookings.length} / ${(session.capacity ?? bookings.length) || 1} booked`;

      return {
        id: session.id,
        title: session.title,
        sessionType: session.type === "PRIVATE" ? "Private" : "Group",
        status: mapSessionStatus({
          startsAt: session.startsAt,
          status: session.status,
          bookings: session.bookings,
        }),
        dayLabel: getDayLabel(session.startsAt),
        timeLabel: timeFormatter.format(session.startsAt),
        location: session.location ?? "Studio floor",
        rosterLabel,
        focus:
          session.description ??
          (session.type === "PRIVATE"
            ? "Private coaching block"
            : "Coached group session"),
        note:
          session.notes[0]?.content ??
          "Attendance updates and coaching notes appear here.",
        bookings,
      };
    });
  }
}

export const coachSessionRepository = new CoachSessionRepository();
