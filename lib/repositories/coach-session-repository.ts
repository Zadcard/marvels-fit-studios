import "server-only";

import type {
  CoachSessionBookingRecord,
  CoachSessionRecord,
  CoachSessionStatus,
} from "@/lib/dashboard/coach-session-data";
import type { CoachScheduleRecord } from "@/lib/dashboard/coach-schedule-data";
import { getPrisma } from "@/lib/prisma";

const dayFormatter = new Intl.DateTimeFormat("en-US", { weekday: "short" });
const dayKeyFormatter = new Intl.DateTimeFormat("en-US", { weekday: "long" });
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});
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

  async listClientOptions(): Promise<Array<{ id: string; fullName: string }>> {
    return this.prisma.client.findMany({
      orderBy: [{ fullName: "asc" }],
      select: {
        id: true,
        fullName: true,
      },
    });
  }

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

  async listScheduleForCoachUserId(userId: string): Promise<CoachScheduleRecord[]> {
    const sessions = await this.listForCoachUserId(userId);

    return sessions.map((session) => {
      const startsAt = new Date(`${new Date().toDateString()} ${session.timeLabel}`);
      const timeRange = session.timeLabel;

      return {
        id: session.id,
        dayKey: dayKeyFormatter.format(
          this.parseSessionDate(session.dayLabel, session.timeLabel)
        ),
        dayLabel: session.dayLabel,
        dateLabel: dateFormatter.format(
          this.parseSessionDate(session.dayLabel, session.timeLabel)
        ),
        title: session.title,
        timeRange,
        sessionType: session.sessionType,
        status: session.status,
        location: session.location,
        rosterLabel: session.rosterLabel,
        note: session.note,
      };
    });
  }

  private parseSessionDate(dayLabel: string, timeLabel: string) {
    const now = new Date();
    const candidate = new Date(now);

    if (dayLabel === "Tomorrow") {
      candidate.setDate(candidate.getDate() + 1);
    } else if (dayLabel !== "Today") {
      const weekdays = [
        "Sun",
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat",
      ];
      const targetDay = weekdays.indexOf(dayLabel);

      if (targetDay >= 0) {
        const offset = (targetDay - candidate.getDay() + 7) % 7;
        candidate.setDate(candidate.getDate() + offset);
      }
    }

    const parsedTime = new Date(`2000-01-01 ${timeLabel}`);
    if (!Number.isNaN(parsedTime.getTime())) {
      candidate.setHours(parsedTime.getHours(), parsedTime.getMinutes(), 0, 0);
    }

    return candidate;
  }
}

export const coachSessionRepository = new CoachSessionRepository();
