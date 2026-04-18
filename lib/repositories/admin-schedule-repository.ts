import "server-only";

import { TrainingSessionStatus, TrainingSessionType } from "@prisma/client";

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

export type AdminScheduleBlockOption = {
  id: string;
  title: string;
};

export type AdminScheduleGroupOption = {
  id: string;
  name: string;
};

export class AdminScheduleRepository {
  private prisma = getPrisma();

  async getSchedule(): Promise<{
    stats: AdminScheduleStat[];
    records: AdminScheduleSessionRecord[];
    coachOptions: AdminSessionCoachOption[];
    blockOptions: AdminScheduleBlockOption[];
    groupOptions: AdminScheduleGroupOption[];
  }> {
    const now = new Date();
    const scheduleWindowStart = new Date(now);
    scheduleWindowStart.setHours(0, 0, 0, 0);
    const scheduleWindowEnd = new Date(scheduleWindowStart);
    scheduleWindowEnd.setDate(scheduleWindowEnd.getDate() + 6);
    scheduleWindowEnd.setHours(23, 59, 59, 999);
    const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [sessions, coaches, blocks, groups] = await Promise.all([
      this.prisma.trainingSession.findMany({
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
          scheduleBlockId: true,
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
          scheduleBlock: {
            select: {
              title: true,
              roster: {
                select: {
                  clientId: true,
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
      }),
      this.prisma.coach.findMany({
        orderBy: [{ fullName: "asc" }],
        select: {
          id: true,
          fullName: true,
        },
      }),
      this.prisma.scheduleBlock.findMany({
        orderBy: [{ title: "asc" }],
        select: {
          id: true,
          title: true,
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
      const bookingsCount = session.bookings.length;
      const waitlistCount = session.bookings.filter(
        (booking) => booking.status === "WAITLIST"
      ).length;
      const scheduleStatus: AdminScheduleSessionStatus = mapScheduleStatus({
        status: session.status,
        bookingsCount,
        capacity: session.capacity,
      });

      return {
        id: session.id,
        title: session.title,
        sessionType:
          session.type === TrainingSessionType.PRIVATE
            ? ("Private" as const)
            : ("Group" as const),
        status: scheduleStatus,
        scheduleBlockId: session.scheduleBlockId,
        scheduleBlockTitle: session.scheduleBlock?.title ?? "Manual session",
        groupName: session.group?.name ?? "No linked group",
        dayKey: dayLabelFormatter.format(session.startsAt),
        dayLabel: dayLabelFormatter.format(session.startsAt),
        dateLabel: dateLabelFormatter.format(session.startsAt),
        timeRange: getTimeRange(session.startsAt, session.endsAt),
        coachId: session.coachId,
        coachName: session.coach.fullName,
        location: session.location ?? "Studio floor",
        occupancyLabel:
          session.type === TrainingSessionType.PRIVATE
            ? `${Math.min(bookingsCount, 1)} / 1 booked`
            : `${bookingsCount} / ${
                session.capacity ?? Math.max(bookingsCount, 1)
              } booked`,
        rosterCount:
          session.scheduleBlock?.roster.length ?? session.group?.clients.length ?? 0,
        bookedCount: bookingsCount,
        waitlistCount,
        attendanceNote:
          bookingsCount > 0
            ? `${bookingsCount} client${bookingsCount === 1 ? "" : "s"} booked so far.`
            : "No active bookings yet.",
        focus:
          session.description ??
          (session.type === TrainingSessionType.PRIVATE
            ? "Private coaching block."
            : "Group training block."),
        highlight:
          scheduleStatus === "Waitlist"
            ? "Session is at capacity"
            : scheduleStatus === "Attention"
              ? "Needs review before it runs"
              : session.scheduleBlock
                ? `Generated from ${session.scheduleBlock.title}`
                : "Manual occurrence",
        startsAt: session.startsAt.toISOString(),
        endsAt: session.endsAt.toISOString(),
        capacity: session.type === TrainingSessionType.PRIVATE ? 1 : session.capacity,
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
    const blockLinkedCount = recordsThisWeek.filter(
      (record) => record.scheduleBlockId
    ).length;

    const stats: AdminScheduleStat[] = [
      {
        id: "weekly-slots",
        label: "This week",
        value: `${recordsThisWeek.length}`,
        change: `${privateCount} private blocks`,
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
      {
        id: "block-linked",
        label: "Block linked",
        value: `${blockLinkedCount}`,
        change: `${blocks.length} total blocks`,
        detail: "Occurrences currently generated from schedule blocks.",
        note: "Series layer",
        icon: "users-round",
        tone: "neutral",
      },
    ];

    return {
      stats,
      records,
      coachOptions: coaches,
      blockOptions: blocks,
      groupOptions: groups,
    };
  }
}

export const adminScheduleRepository = new AdminScheduleRepository();
