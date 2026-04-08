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

export type AdminSessionEditorRecord = {
  id: string;
  title: string;
  description: string;
  type: "GROUP" | "PRIVATE";
  status: "DRAFT" | "SCHEDULED" | "COMPLETED" | "CANCELED";
  coachId: string;
  location: string;
  startsAt: string;
  endsAt: string;
  capacity: number | null;
  bookedClients: Array<{
    id: string;
    fullName: string;
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

export class AdminSessionRepository {
  private prisma = getPrisma();

  async list(): Promise<{
    groupRecords: AdminGroupSessionRecord[];
    privateRecords: AdminPrivateSessionRecord[];
    editorRecords: AdminSessionEditorRecord[];
    coachOptions: AdminSessionCoachOption[];
    clientOptions: AdminSessionClientOption[];
  }> {
    const [sessions, coaches, clients] = await Promise.all([
      this.prisma.trainingSession.findMany({
        orderBy: [{ startsAt: "asc" }],
        select: {
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
              clientId: true,
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
        },
      }),
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

    const groupRecords: AdminGroupSessionRecord[] = [];
    const privateRecords: AdminPrivateSessionRecord[] = [];
    const editorRecords: AdminSessionEditorRecord[] = [];

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

      editorRecords.push({
        id: session.id,
        title: session.title,
        description: session.description ?? "",
        type: session.type,
        status: session.status,
        coachId: session.coachId,
        location: session.location ?? "",
        startsAt: session.startsAt.toISOString(),
        endsAt: session.endsAt.toISOString(),
        capacity: session.capacity,
        bookedClients: session.bookings.map((booking) => ({
          id: booking.client.id,
          fullName: booking.client.fullName,
        })),
      });

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

    return {
      groupRecords,
      privateRecords,
      editorRecords,
      coachOptions: coaches,
      clientOptions: clients,
    };
  }
}

export const adminSessionRepository = new AdminSessionRepository();
