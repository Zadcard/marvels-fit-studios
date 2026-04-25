import "server-only";

import type { CoachClientPlan, CoachClientRecord, CoachClientStatus } from "@/lib/dashboard/coach-client-record";
import { getPrisma, withPrismaFallback } from "@/lib/prisma";

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export interface CoachClientRepository {
  listForCoachUserId(userId: string): Promise<CoachClientRecord[]>;
}

function formatDateTimeLabel(value: Date) {
  return dateTimeFormatter.format(value);
}

function formatDateLabel(value: Date) {
  return dateFormatter.format(value);
}

function determinePlanType(client: {
  group: { coach: { userId: string } } | null;
  subscriptions: Array<{ plan: { name: string; slug: string } }>;
  bookings: Array<{ trainingSession: { type: "GROUP" | "PRIVATE" } }>;
}, coachUserId: string): CoachClientPlan {
  const hasGroupAssignment = client.group?.coach.userId === coachUserId;
  const hasPrivateSession = client.bookings.some(
    (booking) => booking.trainingSession.type === "PRIVATE"
  );

  const planLabels = client.subscriptions
    .map((subscription) => `${subscription.plan.name} ${subscription.plan.slug}`.toLowerCase())
    .join(" ");

  if (planLabels.includes("hybrid") || (hasGroupAssignment && hasPrivateSession)) {
    return "Hybrid";
  }

  if (planLabels.includes("private") || hasPrivateSession) {
    return "Private";
  }

  return "Group";
}

function determineStatus(client: {
  createdAt: Date;
  workoutNotes: Array<{ content: string }>;
  bookings: Array<{ trainingSession: { startsAt: Date } }>;
}): CoachClientStatus {
  const now = Date.now();
  const createdWithinWeek = now - client.createdAt.getTime() <= 7 * 24 * 60 * 60 * 1000;

  if (createdWithinWeek) {
    return "New this week";
  }

  const latestNote = client.workoutNotes[0]?.content.toLowerCase() ?? "";
  if (latestNote.includes("recovery") || latestNote.includes("lighter")) {
    return "Recovery focus";
  }

  const nextUpcomingSession = client.bookings.find(
    (booking) => booking.trainingSession.startsAt.getTime() >= now
  );

  if (!nextUpcomingSession) {
    return "Needs check-in";
  }

  return "On track";
}

function describeLastTouchpoint(client: {
  workoutNotes: Array<{ date: Date }>;
  bookings: Array<{ updatedAt: Date }>;
  createdAt: Date;
}) {
  const latestWorkoutNote = client.workoutNotes[0]?.date;
  if (latestWorkoutNote) {
    return `Progress note ${formatDateLabel(latestWorkoutNote)}`;
  }

  const latestBookingUpdate = client.bookings[0]?.updatedAt;
  if (latestBookingUpdate) {
    return `Session activity ${formatDateLabel(latestBookingUpdate)}`;
  }

  return `Joined ${formatDateLabel(client.createdAt)}`;
}

function describeCurrentFocus(client: {
  workoutNotes: Array<{ content: string }>;
}) {
  return (
    client.workoutNotes[0]?.content ??
    "Assigned to your coaching roster. Add a progress note after the next session."
  );
}

function describeProgressNote(client: {
  bookings: Array<{ trainingSession: { title: string; startsAt: Date; location: string | null } }>;
}) {
  const nextBooking = client.bookings[0];

  if (!nextBooking) {
    return "No booked session yet. Reach out and lock in the next touchpoint.";
  }

  const locationLabel = nextBooking.trainingSession.location
    ? ` at ${nextBooking.trainingSession.location}`
    : "";

  return `Next session is ${nextBooking.trainingSession.title}${locationLabel} on ${formatDateTimeLabel(
    nextBooking.trainingSession.startsAt
  )}.`;
}

export class PrismaCoachClientRepository implements CoachClientRepository {
  async listForCoachUserId(userId: string): Promise<CoachClientRecord[]> {
    return withPrismaFallback(async () => {
      const prisma = getPrisma();

      const clients = await prisma.client.findMany({
      where: {
        OR: [
          {
            group: {
              coach: {
                userId,
              },
            },
          },
          {
            bookings: {
              some: {
                status: {
                  in: ["BOOKED", "ATTENDED", "MISSED", "WAITLIST"],
                },
                trainingSession: {
                  status: {
                    not: "CANCELED",
                  },
                  coach: {
                    userId,
                  },
                },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        createdAt: true,
        group: {
          select: {
            id: true,
            name: true,
            coach: {
              select: {
                userId: true,
              },
            },
          },
        },
        subscriptions: {
          orderBy: [{ startsAt: "desc" }],
          take: 3,
          select: {
            plan: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        },
        bookings: {
          where: {
            status: {
              in: ["BOOKED", "ATTENDED", "MISSED", "WAITLIST"],
            },
            trainingSession: {
              status: {
                not: "CANCELED",
              },
              coach: {
                userId,
              },
            },
          },
          orderBy: [{ trainingSession: { startsAt: "asc" } }],
          select: {
            updatedAt: true,
            trainingSession: {
              select: {
                title: true,
                type: true,
                startsAt: true,
                location: true,
              },
            },
          },
        },
        workoutNotes: {
          orderBy: [{ date: "desc" }],
          take: 5,
          select: {
            id: true,
            content: true,
            date: true,
            updatedAt: true,
            author: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        files: {
          where: {
            deletedAt: null,
            expiresAt: {
              gt: new Date(),
            },
          },
          orderBy: [{ createdAt: "desc" }],
          take: 5,
          select: {
            id: true,
            name: true,
            note: true,
            expiresAt: true,
          },
        },
      },
      orderBy: [{ fullName: "asc" }],
    });

      return clients.map((client) => {
        const upcomingBooking =
          client.bookings.find(
            (booking) => booking.trainingSession.startsAt.getTime() >= Date.now()
          ) ?? client.bookings[0];

        const nextSessionLabel = upcomingBooking
          ? formatDateTimeLabel(upcomingBooking.trainingSession.startsAt)
          : "Not booked";

        return {
          id: client.id,
          fullName: client.fullName,
          phone: client.phone ?? "No phone",
          planType: determinePlanType(client, userId),
          status: determineStatus(client),
          nextSession: nextSessionLabel,
          lastTouchpoint: describeLastTouchpoint(client),
          currentFocus: describeCurrentFocus(client),
          progressNote: describeProgressNote(
            upcomingBooking ? { bookings: [upcomingBooking] } : { bookings: [] }
          ),
          groupId: client.group?.id ?? null,
          groupName: client.group?.name ?? "No group",
          privateNotes: client.workoutNotes.map((note) => ({
            id: note.id,
            content: note.content,
            authorName: note.author?.name ?? note.author?.email ?? "Coach",
            updatedAtLabel: formatDateLabel(note.updatedAt ?? note.date),
          })),
          activeFiles: client.files.map((file) => ({
            id: file.id,
            name: file.name,
            note: file.note ?? "No note added.",
            expiresAtLabel: formatDateLabel(file.expiresAt),
          })),
        };
      });
    }, []);
  }
}

export const coachClientRepository: CoachClientRepository =
  new PrismaCoachClientRepository();
