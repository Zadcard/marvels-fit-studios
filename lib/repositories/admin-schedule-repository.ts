import "server-only";

import type {
  AdminScheduleSessionRecord,
  AdminScheduleSessionStatus,
  AdminScheduleStat,
} from "@/lib/dashboard/admin-schedule-data";
import { getPrisma } from "@/lib/prisma";
import type { AdminSessionCoachOption } from "@/lib/repositories/admin-session-repository";

const dayLabelFormatter = new Intl.DateTimeFormat("en-US", { weekday: "long" });
const dateLabelFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});
const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

function mapScheduleStatus(input: {
  status: "DRAFT" | "SCHEDULED" | "COMPLETED" | "CANCELED";
  bookingsCount: number;
  capacity: number | null;
}): AdminScheduleSessionStatus {
  if (input.status === "COMPLETED") {
    return "Completed";
  }

  if (
    input.capacity !== null &&
    input.capacity > 0 &&
    input.bookingsCount >= input.capacity
  ) {
    return "Waitlist";
  }

  if (input.status === "DRAFT" || input.status === "CANCELED") {
    return "Attention";
  }

  return "Confirmed";
}

function getTimeRange(startsAt: Date, endsAt: Date) {
  return `${timeFormatter.format(startsAt)} - ${timeFormatter.format(endsAt)}`;
}

export class AdminScheduleRepository {
  private prisma = getPrisma();

  async getSchedule(): Promise<{
    stats: AdminScheduleStat[];
    records: AdminScheduleSessionRecord[];
    coachOptions: AdminSessionCoachOption[];
  }> {
    const [sessions, coaches] = await Promise.all([
      this.prisma.trainingSession.findMany({
        orderBy: [{ startsAt: "asc" }],
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          status: true,
          startsAt: true,
          endsAt: true,
          location: true,
          capacity: true,
          coachId: true,
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
              id: true,
            },
          },
        },
      }),
      this.prisma.coach.findMany({
        orderBy: [{ fullName: "asc" }],
        select: {
          id: true,
          fullName: true,
        },
      }),
    ]);

    const records = sessions.map((session) => {
      const bookingsCount = session.bookings.length;
      const scheduleStatus = mapScheduleStatus({
        status: session.status,
        bookingsCount,
        capacity: session.capacity,
      });

      return {
        id: session.id,
        title: session.title,
        sessionType:
          session.type === "PRIVATE"
            ? ("Private" as const)
            : ("Group" as const),
        status: scheduleStatus,
        dayKey: dayLabelFormatter.format(session.startsAt),
        dayLabel: dayLabelFormatter.format(session.startsAt),
        dateLabel: dateLabelFormatter.format(session.startsAt),
        timeRange: getTimeRange(session.startsAt, session.endsAt),
        coachId: session.coachId,
        coachName: session.coach.fullName,
        location: session.location ?? "Studio floor",
        occupancyLabel:
          session.type === "PRIVATE"
            ? `${Math.min(bookingsCount, 1)} / 1 booked`
            : `${bookingsCount} / ${session.capacity ?? Math.max(bookingsCount, 1)} booked`,
        attendanceNote:
          bookingsCount > 0
            ? `${bookingsCount} client${bookingsCount === 1 ? "" : "s"} booked so far.`
            : "No active bookings yet.",
        focus:
          session.description ??
          (session.type === "PRIVATE"
            ? "Private coaching block."
            : "Group training block."),
        highlight:
          scheduleStatus === "Waitlist"
            ? "Session is at capacity"
            : scheduleStatus === "Attention"
              ? "Needs review before it runs"
              : "On track",
        startsAt: session.startsAt.toISOString(),
        endsAt: session.endsAt.toISOString(),
        capacity: session.type === "PRIVATE" ? 1 : session.capacity,
      };
    });

    const weeklySlots = records.length;
    const waitlistCount = records.filter((record) => record.status === "Waitlist").length;
    const privateCount = records.filter((record) => record.sessionType === "Private").length;
    const confirmedCount = records.filter((record) => record.status === "Confirmed").length;

    const stats: AdminScheduleStat[] = [
      {
        id: "weekly-slots",
        label: "Weekly slots",
        value: `${weeklySlots}`,
        change: `${privateCount} private blocks`,
        detail: "Live session count from the database.",
        note: "Database-backed",
        icon: "calendar-clock",
        tone: "accent",
      },
      {
        id: "coach-coverage",
        label: "Coach coverage",
        value: `${coaches.length}`,
        change: `${confirmedCount} confirmed sessions`,
        detail: "Active coach options available for assignment.",
        note: "Database-backed",
        icon: "target",
        tone: "success",
      },
      {
        id: "attention",
        label: "Needs attention",
        value: `${records.filter((record) => record.status === "Attention").length}`,
        change: `${waitlistCount} at capacity`,
        detail: "Draft, canceled, or otherwise review-worthy sessions.",
        note: "Database-backed",
        icon: "clock-3",
        tone: waitlistCount > 0 ? "warning" : "neutral",
      },
      {
        id: "occupancy",
        label: "Booked sessions",
        value: `${records.filter((record) => !record.occupancyLabel.startsWith("0 /")).length}`,
        change: `${records.length} total tracked`,
        detail: "Sessions with at least one active booking.",
        note: "Database-backed",
        icon: "users-round",
        tone: "neutral",
      },
    ];

    return {
      stats,
      records,
      coachOptions: coaches,
    };
  }
}

export const adminScheduleRepository = new AdminScheduleRepository();
