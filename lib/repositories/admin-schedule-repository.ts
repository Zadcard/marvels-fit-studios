import "server-only";

import { TrainingSessionStatus, TrainingSessionType } from "@/lib/supabase/domain";
import type {
  AdminScheduleSessionRecord,
  AdminScheduleSessionStatus,
  AdminScheduleStat,
} from "@/lib/dashboard/admin-schedule-data";
import { getPrisma, withPrismaFallback } from "@/lib/prisma";
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
  status: TrainingSessionStatus;
  bookingsCount: number;
  capacity: number | null;
}) {
  if (input.status === TrainingSessionStatus.COMPLETED) {
    return "Completed" as const;
  }

  if (
    input.capacity !== null &&
    input.capacity > 0 &&
    input.bookingsCount >= input.capacity
  ) {
    return "Waitlist" as const;
  }

  if (
    input.status === TrainingSessionStatus.DRAFT ||
    input.status === TrainingSessionStatus.CANCELED
  ) {
    return "Attention" as const;
  }

  return "Confirmed" as const;
}

function getTimeRange(startsAt: Date, endsAt: Date) {
  return `${timeFormatter.format(startsAt)} - ${timeFormatter.format(endsAt)}`;
}

export type AdminScheduleGroupOption = {
  id: string;
  name: string;
};

export class AdminScheduleRepository {
  private get prisma() {
    return getPrisma();
  }

  async getSchedule(): Promise<{
    stats: AdminScheduleStat[];
    records: AdminScheduleSessionRecord[];
    coachOptions: AdminSessionCoachOption[];
    groupOptions: AdminScheduleGroupOption[];
  }> {
    return withPrismaFallback(async () => {
      const now = new Date();
      const scheduleWindowStart = new Date(now);
      scheduleWindowStart.setHours(0, 0, 0, 0);
      const scheduleWindowEnd = new Date(scheduleWindowStart);
      scheduleWindowEnd.setDate(scheduleWindowEnd.getDate() + 6);
      scheduleWindowEnd.setHours(23, 59, 59, 999);
      const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const sessionsPromise = this.prisma.trainingSession.findMany({
      where: {
        startsAt: {
          gte: scheduleWindowStart,
          lte: scheduleWindowEnd,
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
        endsAt: true,
        location: true,
        capacity: true,
        coachId: true,
        coach: {
          select: {
            fullName: true,
          },
        },
        group: {
          select: {
            name: true,
            clients: {
              select: {
                id: true,
              },
            },
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
            status: true,
          },
        },
      },
    });

      const [sessions, coaches, groups] = await Promise.all([
      sessionsPromise,
      this.prisma.coach.findMany({
        orderBy: [{ fullName: "asc" }],
        select: {
          id: true,
          fullName: true,
        },
      }),
      this.prisma.group.findMany({
        orderBy: [{ name: "asc" }],
        select: {
          id: true,
          name: true,
        },
      }),
    ]);
      const records = sessions.map((session) => {
      const scheduleSession = session as unknown as {
        id: string;
        title: string;
        description: string | null;
        startsAt: Date;
        endsAt: Date;
        location: string | null;
        coachId: string;
        coach: { fullName: string };
        bookings: Array<{ id: string; status: string }>;
        status: TrainingSessionStatus;
        capacity: number | null;
        type: TrainingSessionType;
        group?: { name: string; clients: Array<{ id: string }> } | null;
      };
      const bookingsCount = scheduleSession.bookings.length;
      const waitlistCount = scheduleSession.bookings.filter(
        (booking) => booking.status === "WAITLIST"
      ).length;
      const scheduleStatus: AdminScheduleSessionStatus = mapScheduleStatus({
        status: scheduleSession.status,
        bookingsCount,
        capacity: scheduleSession.capacity,
      });

      return {
        id: scheduleSession.id,
        title: scheduleSession.title,
        sessionType:
          scheduleSession.type === TrainingSessionType.PRIVATE
            ? ("Private" as const)
            : ("Group" as const),
        status: scheduleStatus,
        groupName: scheduleSession.group?.name ?? "No linked group",
        dayKey: dayLabelFormatter.format(scheduleSession.startsAt),
        dayLabel: dayLabelFormatter.format(scheduleSession.startsAt),
        dateLabel: dateLabelFormatter.format(scheduleSession.startsAt),
        timeRange: getTimeRange(scheduleSession.startsAt, scheduleSession.endsAt),
        coachId: scheduleSession.coachId,
        coachName: scheduleSession.coach.fullName,
        location: scheduleSession.location ?? "Studio floor",
        occupancyLabel:
          scheduleSession.type === TrainingSessionType.PRIVATE
            ? `${Math.min(bookingsCount, 1)} / 1 booked`
            : `${bookingsCount} / ${
                scheduleSession.capacity ?? Math.max(bookingsCount, 1)
              } booked`,
        rosterCount:
          scheduleSession.group?.clients.length ?? 0,
        bookedCount: bookingsCount,
        waitlistCount,
        attendanceNote:
          bookingsCount > 0
            ? `${bookingsCount} client${bookingsCount === 1 ? "" : "s"} booked so far.`
            : "No active bookings yet.",
        focus:
          scheduleSession.description ??
          (scheduleSession.type === TrainingSessionType.PRIVATE
            ? "Private coaching session."
            : "Group training session."),
        highlight:
          scheduleStatus === "Waitlist"
            ? "Session is at capacity"
            : scheduleStatus === "Attention"
              ? "Needs review before it runs"
              : "Manual session",
        startsAt: scheduleSession.startsAt.toISOString(),
        endsAt: scheduleSession.endsAt.toISOString(),
        capacity:
          scheduleSession.type === TrainingSessionType.PRIVATE
            ? 1
            : scheduleSession.capacity,
      } satisfies AdminScheduleSessionRecord;
      });

    const recordsThisWeek = records.filter(
      (record) => new Date(record.startsAt) >= now && new Date(record.startsAt) <= weekEnd
    );
    const waitlistCount = recordsThisWeek.filter(
      (record) => record.status === "Waitlist"
    ).length;
    const privateCount = recordsThisWeek.filter(
      (record) => record.sessionType === "Private"
    ).length;
    const confirmedCount = recordsThisWeek.filter(
      (record) => record.status === "Confirmed"
    ).length;
      const stats: AdminScheduleStat[] = [
      {
        id: "weekly-slots",
        label: "This week",
        value: `${recordsThisWeek.length}`,
        change: `${privateCount} private sessions`,
        detail: "Upcoming occurrences currently on the operational board.",
        note: "Occurrence layer",
        icon: "calendar-clock",
        tone: "accent",
      },
      {
        id: "coach-coverage",
        label: "Coach coverage",
        value: `${coaches.length}`,
        change: `${confirmedCount} confirmed sessions`,
        detail: "Available coaches connected to the week view.",
        note: "Roster live",
        icon: "target",
        tone: "success",
      },
      {
        id: "attention",
        label: "Needs attention",
        value: `${recordsThisWeek.filter((record) => record.status === "Attention").length}`,
        change: `${waitlistCount} at capacity`,
        detail: "Draft, canceled, or overloaded sessions in the planning window.",
        note: "Operational watch",
        icon: "clock-3",
        tone: waitlistCount > 0 ? "warning" : "neutral",
      },
    ];

      return {
        stats,
        records,
        coachOptions: coaches,
        groupOptions: groups,
      };
    }, {
      stats: [],
      records: [],
      coachOptions: [],
      groupOptions: [],
    });
  }
}

export const adminScheduleRepository = new AdminScheduleRepository();
