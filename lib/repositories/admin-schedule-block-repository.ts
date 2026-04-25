import "server-only";

import {
  ScheduleBlockStatus,
  TrainingSessionStatus,
  TrainingSessionType,
} from "@prisma/client";

import type {
  AdminScheduleBlockClientOption,
  AdminScheduleBlockCoachOption,
  AdminScheduleBlockGroupOption,
  AdminScheduleBlockRecord,
  AdminScheduleBlockStat,
} from "@/lib/dashboard/admin-blocks-data";
import { getPrisma, withPrismaFallback } from "@/lib/prisma";
import {
  formatRecurrenceSummary,
  rangesOverlap,
} from "@/lib/services/schedule-block-utils";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});
const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});
const dayFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
});

function formatDate(value: Date | null | undefined) {
  return value ? dateFormatter.format(value) : "TBD";
}

function toDayDateString(value: Date) {
  return value.toISOString().slice(0, 10);
}

function formatDateTime(value: Date | null | undefined) {
  if (!value) {
    return "Not scheduled";
  }

  return `${dateFormatter.format(value)} ${timeFormatter.format(value)}`;
}

function mapBlockStatus(status: ScheduleBlockStatus) {
  switch (status) {
    case ScheduleBlockStatus.PAUSED:
      return "Paused" as const;
    case ScheduleBlockStatus.ARCHIVED:
      return "Archived" as const;
    default:
      return "Active" as const;
  }
}

function mapSessionType(type: TrainingSessionType) {
  return type === TrainingSessionType.PRIVATE ? "Private" : "Group";
}

export class AdminScheduleBlockRepository {
  private get prisma() {
    return getPrisma();
  }

  async list(): Promise<{
    stats: AdminScheduleBlockStat[];
    blockRecords: AdminScheduleBlockRecord[];
    coachOptions: AdminScheduleBlockCoachOption[];
    groupOptions: AdminScheduleBlockGroupOption[];
    clientOptions: AdminScheduleBlockClientOption[];
  }> {
    return withPrismaFallback(async () => {
      const now = new Date();
      const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const scheduleBlockDelegate = this.prisma.scheduleBlock as
        | typeof this.prisma.scheduleBlock
        | undefined;

      const [groups, coaches, clients] = await Promise.all([
      this.prisma.group.findMany({
        orderBy: [{ name: "asc" }],
        select: {
          id: true,
          name: true,
          type: true,
          coach: {
            select: {
              fullName: true,
            },
          },
          _count: {
            select: {
              clients: true,
            },
          },
        },
      }),
      this.prisma.coach.findMany({
        orderBy: [{ fullName: "asc" }],
        select: {
          id: true,
          fullName: true,
          groups: {
            select: {
              _count: {
                select: {
                  clients: true,
                },
              },
            },
          },
          trainingSessions: {
            where: {
              startsAt: {
                gte: now,
                lte: weekEnd,
              },
              status: {
                in: ["DRAFT", "SCHEDULED"],
              },
            },
            select: {
              id: true,
            },
          },
        },
      }),
      this.prisma.client.findMany({
        orderBy: [{ fullName: "asc" }],
        select: {
          id: true,
          fullName: true,
          bookings: {
            where: {
              status: {
                in: ["BOOKED", "ATTENDED", "WAITLIST"],
              },
              trainingSession: {
                startsAt: {
                  gte: now,
                },
                status: {
                  in: ["DRAFT", "SCHEDULED"],
                },
              },
            },
            orderBy: {
              trainingSession: {
                startsAt: "asc",
              },
            },
            take: 1,
            select: {
              trainingSession: {
                select: {
                  startsAt: true,
                  coach: {
                    select: {
                      fullName: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
    ]);
      const futureSessions = scheduleBlockDelegate
        ? await this.prisma.trainingSession.findMany({
          where: {
            startsAt: {
              gte: now,
            },
            status: {
              in: ["DRAFT", "SCHEDULED"],
            },
          },
          select: {
            id: true,
            title: true,
            coachId: true,
            scheduleBlockId: true,
            startsAt: true,
            endsAt: true,
          },
        })
        : [];
      const blocks = scheduleBlockDelegate
        ? await scheduleBlockDelegate.findMany({
          orderBy: [{ startsOn: "asc" }, { title: "asc" }],
          select: {
            id: true,
            title: true,
            description: true,
            sessionType: true,
            status: true,
            recurrenceDays: true,
            startsOn: true,
            endsOn: true,
            startTime: true,
            endTime: true,
            timezone: true,
            location: true,
            capacity: true,
            coachId: true,
            coach: {
              select: {
                fullName: true,
              },
            },
            groupId: true,
            group: {
              select: {
                name: true,
              },
            },
            roster: {
              orderBy: {
                client: {
                  fullName: "asc",
                },
              },
              select: {
                clientId: true,
                client: {
                  select: {
                    id: true,
                    fullName: true,
                    bookings: {
                      where: {
                        status: {
                          in: ["BOOKED", "ATTENDED", "WAITLIST"],
                        },
                        trainingSession: {
                          status: {
                            in: ["DRAFT", "SCHEDULED"],
                          },
                          startsAt: {
                            gte: now,
                          },
                        },
                      },
                      orderBy: {
                        trainingSession: {
                          startsAt: "asc",
                        },
                      },
                      take: 1,
                      select: {
                        trainingSession: {
                          select: {
                            startsAt: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            sessions: {
              where: {
                startsAt: {
                  gte: now,
                },
              },
              orderBy: {
                startsAt: "asc",
              },
              select: {
                id: true,
                startsAt: true,
                endsAt: true,
                status: true,
                capacity: true,
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
            },
          },
        })
        : [];

      const blocksByCoachId = new Map<string, typeof blocks>();
      const firstBlockByClientId = new Map<
      string,
      { id: string; title: string; startsOn: Date }
      >();

      for (const block of blocks) {
      const coachBlocks = blocksByCoachId.get(block.coachId) ?? [];
      coachBlocks.push(block);
      blocksByCoachId.set(block.coachId, coachBlocks);

      for (const rosterEntry of block.roster) {
        const currentBlock = firstBlockByClientId.get(rosterEntry.clientId);
        if (!currentBlock || block.startsOn < currentBlock.startsOn) {
          firstBlockByClientId.set(rosterEntry.clientId, {
            id: block.id,
            title: block.title,
            startsOn: block.startsOn,
          });
        }
      }
      }

      const blockRecords = blocks.map((block) => {
      const conflictSessions = futureSessions.filter(
        (session) =>
          session.coachId === block.coachId &&
          session.scheduleBlockId !== block.id &&
          block.sessions.some((occurrence) =>
            rangesOverlap(
              occurrence.startsAt,
              occurrence.endsAt,
              session.startsAt,
              session.endsAt
            )
          )
      );

      const sessionsThisWeek = block.sessions.filter(
        (session) => session.startsAt <= weekEnd
      ).length;
      const nextOccurrence = block.sessions[0];

      return {
        id: block.id,
        title: block.title,
        description: block.description ?? "",
        sessionType: mapSessionType(block.sessionType),
        status: mapBlockStatus(block.status),
        recurrenceDays: block.recurrenceDays,
        startsOn: toDayDateString(block.startsOn),
        endsOn: toDayDateString(block.endsOn),
        startTime: block.startTime,
        endTime: block.endTime,
        timezone: block.timezone,
        recurrenceSummary: formatRecurrenceSummary(block.recurrenceDays),
        activeDateRange: `${formatDate(block.startsOn)} - ${formatDate(block.endsOn)}`,
        nextOccurrenceLabel: nextOccurrence
          ? `${dayFormatter.format(nextOccurrence.startsAt)} ${formatDateTime(
              nextOccurrence.startsAt
            )}`
          : "No future occurrence",
        coachId: block.coachId,
        coachName: block.coach.fullName,
        groupId: block.groupId,
        groupName: block.group?.name ?? "No linked group",
        location: block.location ?? "Studio floor",
        capacityLabel:
          block.sessionType === TrainingSessionType.PRIVATE
            ? "1:1 block"
            : `${block.capacity ?? block.roster.length} seats`,
        rosterCount: block.roster.length,
        sessionsThisWeek,
        totalUpcomingOccurrences: block.sessions.length,
        conflicts: conflictSessions.map(
          (session) => `${session.title} · ${formatDateTime(session.startsAt)}`
        ),
        note:
          block.description ??
          (block.sessionType === TrainingSessionType.PRIVATE
            ? "Private block with coach-led repetition."
            : "Recurring group block with shared roster."),
        clientIds: block.roster.map((entry) => entry.clientId),
        clients: block.roster.map((entry) => ({
          id: entry.client.id,
          fullName: entry.client.fullName,
          nextSession:
            entry.client.bookings[0]?.trainingSession.startsAt
              ? formatDateTime(entry.client.bookings[0].trainingSession.startsAt)
              : "Not booked",
        })),
        upcomingOccurrences: block.sessions.slice(0, 4).map((session) => ({
          id: session.id,
          dateLabel: formatDate(session.startsAt),
          timeLabel: timeFormatter.format(session.startsAt),
          occupancyLabel:
            block.sessionType === TrainingSessionType.PRIVATE
              ? `${Math.min(session.bookings.length, 1)} / 1 booked`
              : `${session.bookings.length} / ${
                  session.capacity ?? Math.max(block.roster.length, 1)
                } booked`,
          status:
            session.status === TrainingSessionStatus.DRAFT
              ? "Draft"
              : session.status === TrainingSessionStatus.CANCELED
                ? "Canceled"
                : "Scheduled",
        })),
      } satisfies AdminScheduleBlockRecord;
      });

      const coachOptions = coaches.map((coach) => ({
      id: coach.id,
      fullName: coach.fullName,
      sessionsThisWeek: coach.trainingSessions.length,
      recurringBlocks: blocksByCoachId.get(coach.id)?.length ?? 0,
      activeClients: coach.groups.reduce(
        (total, group) => total + group._count.clients,
        0
      ),
    }));

      const groupOptions = groups.map((group) => ({
      id: group.id,
      name: group.name,
      type: (group.type === "PRIVATE" ? "Private" : "Group") as "Group" | "Private",
      coachName: group.coach.fullName,
      memberCount: group._count.clients,
    }));

      const clientOptions = clients.map((client) => ({
      id: client.id,
      fullName: client.fullName,
      currentBlockId: firstBlockByClientId.get(client.id)?.id ?? null,
      currentBlockName: firstBlockByClientId.get(client.id)?.title ?? "No block",
      assignedCoach:
        client.bookings[0]?.trainingSession.coach.fullName ?? "Unassigned",
      nextSession: client.bookings[0]?.trainingSession.startsAt
        ? formatDateTime(client.bookings[0].trainingSession.startsAt)
        : "Awaiting first session",
    }));

      const activeBlocks = blockRecords.filter((block) => block.status === "Active").length;
      const pausedBlocks = blockRecords.filter((block) => block.status === "Paused").length;
      const totalConflicts = blockRecords.reduce(
      (total, block) => total + block.conflicts.length,
      0
    );
      const rosteredClients = new Set(
      blockRecords.flatMap((block) => block.clientIds)
      ).size;

      const stats: AdminScheduleBlockStat[] = [
      {
        id: "active-blocks",
        label: "Active blocks",
        value: String(activeBlocks),
        change: `${pausedBlocks} paused`,
        detail: "Recurring block structures currently driving the studio week.",
        note: "Schedule layer",
        icon: "calendar-clock",
        tone: activeBlocks > 0 ? "accent" : "neutral",
      },
      {
        id: "rostered-clients",
        label: "Rostered clients",
        value: String(rosteredClients),
        change: `${clientOptions.length} total clients`,
        detail: "Clients currently attached to at least one recurring block.",
        note: "Roster layer",
        icon: "users-round",
        tone: "success",
      },
      {
        id: "conflicts",
        label: "Coach conflicts",
        value: String(totalConflicts),
        change: `${blockRecords.length} blocks tracked`,
        detail: "Overlapping future sessions detected for block-assigned coaches.",
        note: "Operational watch",
        icon: "clock-3",
        tone: totalConflicts > 0 ? "warning" : "success",
      },
      {
        id: "occurrences",
        label: "Next 7 days",
        value: String(
          blockRecords.reduce((total, block) => total + block.sessionsThisWeek, 0)
        ),
        change: `${groupOptions.length} groups linked`,
        detail: "Upcoming generated occurrences in the current planning window.",
        note: "Generated series",
        icon: "target",
        tone: "neutral",
      },
    ];

      return {
        stats,
        blockRecords,
        coachOptions,
        groupOptions,
        clientOptions,
      };
    }, {
      stats: [],
      blockRecords: [],
      coachOptions: [],
      groupOptions: [],
      clientOptions: [],
    });
  }
}

export const adminScheduleBlockRepository = new AdminScheduleBlockRepository();
