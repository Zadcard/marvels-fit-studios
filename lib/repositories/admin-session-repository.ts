import "server-only";

import type { Prisma } from "@prisma/client";

import type {
  AdminGroupSessionRecord,
  AdminPrivateSessionRecord,
  AdminSessionStatus,
} from "@/lib/mocks/admin-sessions";
import { getPrisma, withPrismaFallback } from "@/lib/prisma";

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
  if (status === "CANCELED") {
    return "Canceled";
  }

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

function mapBookedClientStatus(
  status: "BOOKED" | "ATTENDED" | "MISSED" | "CANCELED" | "WAITLIST"
): AdminSessionEditorRecord["bookedClients"][number]["status"] | null {
  switch (status) {
    case "BOOKED":
    case "ATTENDED":
    case "MISSED":
    case "WAITLIST":
      return status;
    default:
      return null;
  }
}

export type AdminSessionEditorRecord = {
  id: string;
  title: string;
  description: string;
  type: "GROUP" | "PRIVATE";
  status: "DRAFT" | "SCHEDULED" | "COMPLETED" | "CANCELED";
  coachId: string;
  scheduleBlockId: string | null;
  scheduleBlockTitle: string;
  groupId: string | null;
  groupName: string;
  location: string;
  startsAt: string;
  endsAt: string;
  capacity: number | null;
  bookedClients: Array<{
    id: string;
    fullName: string;
    status: "BOOKED" | "ATTENDED" | "MISSED" | "WAITLIST";
  }>;
};

export type AdminSessionCoachOption = {
  id: string;
  fullName: string;
};

export type AdminSessionClientOption = {
  id: string;
  fullName: string;
};

export type AdminSessionBlockOption = {
  id: string;
  title: string;
};

export class AdminSessionRepository {
  private get prisma() {
    return getPrisma();
  }

  async list(): Promise<{
    groupRecords: AdminGroupSessionRecord[];
    privateRecords: AdminPrivateSessionRecord[];
    editorRecords: AdminSessionEditorRecord[];
    coachOptions: AdminSessionCoachOption[];
    clientOptions: AdminSessionClientOption[];
    blockOptions: AdminSessionBlockOption[];
  }> {
    return withPrismaFallback(async () => {
      const scheduleBlockDelegate = this.prisma.scheduleBlock as
        | typeof this.prisma.scheduleBlock
        | undefined;
      const baseSessionSelect = {
      id: true,
      title: true,
      description: true,
      startsAt: true,
      endsAt: true,
      location: true,
      status: true,
      type: true,
      capacity: true,
      coachId: true,
      groupId: true,
      coach: {
        select: {
          fullName: true,
        },
      },
      group: {
        select: {
          name: true,
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
      notes: {
        orderBy: [{ createdAt: "desc" }],
        take: 1,
        select: {
          content: true,
        },
      },
    } as const;

      const sessionsPromise = this.prisma.trainingSession.findMany({
      orderBy: [{ startsAt: "asc" }],
      select: (scheduleBlockDelegate
        ? {
            ...baseSessionSelect,
            scheduleBlockId: true,
            scheduleBlock: {
              select: {
                title: true,
              },
            },
          }
        : baseSessionSelect) as unknown as Prisma.TrainingSessionSelect,
    });

      const [sessions, coaches, clients] = await Promise.all([
      sessionsPromise,
      this.prisma.coach.findMany({
        orderBy: [{ fullName: "asc" }],
        select: {
          id: true,
          fullName: true,
        },
      }),
      this.prisma.client.findMany({
        orderBy: [{ fullName: "asc" }],
        select: {
          id: true,
          fullName: true,
        },
      }),
    ]);
      const blocks = scheduleBlockDelegate
        ? await scheduleBlockDelegate.findMany({
          orderBy: [{ title: "asc" }],
          select: {
            id: true,
            title: true,
          },
        })
        : [];

      const groupRecords: AdminGroupSessionRecord[] = [];
      const privateRecords: AdminPrivateSessionRecord[] = [];
      const editorRecords: AdminSessionEditorRecord[] = [];

      for (const session of sessions) {
      const scheduleSession = session as unknown as {
        id: string;
        title: string;
        description: string | null;
        startsAt: Date;
        endsAt: Date;
        location: string | null;
        status: "DRAFT" | "SCHEDULED" | "COMPLETED" | "CANCELED";
        type: "GROUP" | "PRIVATE";
        capacity: number | null;
        coachId: string;
        groupId: string | null;
        coach: { fullName: string };
        group?: { name: string } | null;
        bookings: Array<{
          status: "BOOKED" | "ATTENDED" | "MISSED" | "CANCELED" | "WAITLIST";
          client: { id: string; fullName: string };
        }>;
        notes: Array<{ content: string }>;
        scheduleBlockId?: string | null;
        scheduleBlock?: { title: string } | null;
      };
      const bookedClients = scheduleSession.bookings
        .map((booking) => {
          const status = mapBookedClientStatus(booking.status);

          if (!status) {
            return null;
          }

          return {
            id: booking.client.id,
            fullName: booking.client.fullName,
            status,
          };
        })
        .filter(
          (
            booking
          ): booking is AdminSessionEditorRecord["bookedClients"][number] => booking !== null
        );
      const enrolled = bookedClients.length;
      const isAtCapacity =
        scheduleSession.capacity !== null &&
        scheduleSession.capacity > 0 &&
        enrolled >= scheduleSession.capacity;
      const baseRecord = {
        id: scheduleSession.id,
        title: scheduleSession.title,
        coachName: scheduleSession.coach.fullName,
        dayLabel: getDayLabel(scheduleSession.startsAt),
        timeLabel: timeFormatter.format(scheduleSession.startsAt),
        location: scheduleSession.location ?? "Studio floor",
        status: mapStatus(scheduleSession.status, isAtCapacity),
      };

      editorRecords.push({
        id: scheduleSession.id,
        title: scheduleSession.title,
        description: scheduleSession.description ?? "",
        type: scheduleSession.type,
        status: scheduleSession.status,
        coachId: scheduleSession.coachId,
        scheduleBlockId: scheduleSession.scheduleBlockId ?? null,
        scheduleBlockTitle: scheduleSession.scheduleBlock?.title ?? "Manual session",
        groupId: scheduleSession.groupId,
        groupName: scheduleSession.group?.name ?? "No linked group",
        location: scheduleSession.location ?? "",
        startsAt: scheduleSession.startsAt.toISOString(),
        endsAt: scheduleSession.endsAt.toISOString(),
        capacity: scheduleSession.capacity,
        bookedClients,
      });

      if (scheduleSession.type === "PRIVATE") {
        privateRecords.push({
          ...baseRecord,
          clientName: bookedClients[0]?.fullName ?? "Unassigned",
          focus: scheduleSession.notes[0]?.content ?? "Private coaching block",
        });
      } else {
        groupRecords.push({
          ...baseRecord,
          capacity: scheduleSession.capacity ?? Math.max(enrolled, 1),
          enrolled,
        });
      }
      }

      return {
        groupRecords,
        privateRecords,
        editorRecords,
        coachOptions: coaches,
        clientOptions: clients,
        blockOptions: blocks,
      };
    }, {
      groupRecords: [],
      privateRecords: [],
      editorRecords: [],
      coachOptions: [],
      clientOptions: [],
      blockOptions: [],
    });
  }
}

export const adminSessionRepository = new AdminSessionRepository();
