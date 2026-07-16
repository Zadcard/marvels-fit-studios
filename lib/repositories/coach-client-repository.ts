import "server-only";

import { UserRole } from "@/lib/supabase/domain";

import type {
  CoachClientPlan,
  CoachClientRecord,
  CoachClientStatus,
} from "@/lib/dashboard/coach-client-record";
import {
  injuryStatusHasAlert,
  injuryStatusLabelFor,
  trainingCategoryLabelFor,
} from "@/lib/dashboard/client-domain-labels";
import { withSupabaseFallback } from "@/lib/supabase/errors";
import { getSupabaseServerClient } from "@/lib/supabase/server";

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

function determinePlanType(
  client: {
    group: { coach: { userId: string } } | null;
    subscriptions: Array<{ plan: { name: string; slug: string } }>;
    bookings: Array<{ trainingSession: { type: "GROUP" | "PRIVATE" } }>;
  },
  coachUserId: string,
): CoachClientPlan {
  const hasGroupAssignment = client.group?.coach.userId === coachUserId;
  const hasPrivateSession = client.bookings.some(
    (booking) => booking.trainingSession.type === "PRIVATE",
  );

  const planLabels = client.subscriptions
    .map((subscription) =>
      `${subscription.plan.name} ${subscription.plan.slug}`.toLowerCase(),
    )
    .join(" ");

  if (
    planLabels.includes("hybrid") ||
    (hasGroupAssignment && hasPrivateSession)
  ) {
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
  const createdWithinWeek =
    now - client.createdAt.getTime() <= 7 * 24 * 60 * 60 * 1000;

  if (createdWithinWeek) {
    return "New this week";
  }

  const latestNote = client.workoutNotes[0]?.content.toLowerCase() ?? "";
  if (latestNote.includes("recovery") || latestNote.includes("lighter")) {
    return "Recovery focus";
  }

  const nextUpcomingSession = client.bookings.find(
    (booking) => booking.trainingSession.startsAt.getTime() >= now,
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
  bookings: Array<{
    trainingSession: { title: string; startsAt: Date; location: string | null };
  }>;
}) {
  const nextBooking = client.bookings[0];

  if (!nextBooking) {
    return "No booked session yet. Reach out and lock in the next touchpoint.";
  }

  const locationLabel = nextBooking.trainingSession.location
    ? ` at ${nextBooking.trainingSession.location}`
    : "";

  return `Next session is ${nextBooking.trainingSession.title}${locationLabel} on ${formatDateTimeLabel(
    nextBooking.trainingSession.startsAt,
  )}.`;
}

export class SupabaseCoachClientRepository implements CoachClientRepository {
  async listForCoachUserId(userId: string): Promise<CoachClientRecord[]> {
    return withSupabaseFallback(async () => {
      const supabase = getSupabaseServerClient();
      const { data, error } = await supabase
        .from("Client")
        .select(
          `
          id, fullName, phone, createdAt,
          trainingCategory, injuryStatus, injuryNotes, restrictions,
          group:Group(id, name, coach:Coach(userId)),
          subscriptions:ClientSubscription(startsAt,
            plan:SubscriptionPlan(name, slug)),
          bookings:SessionBooking(status, updatedAt,
            trainingSession:TrainingSession(title, type, status, startsAt, location,
              coach:Coach(userId))),
          workoutNotes:WorkoutNote(id, content, date, updatedAt, isPrivate,
            author:User(name, email, role)),
          files:File(id, name, note, expiresAt, createdAt, deletedAt)
        `,
        )
        .order("fullName");
      if (error) throw error;

      const now = Date.now();
      const clients = data
        .map((client) => ({
          ...client,
          createdAt: new Date(client.createdAt),
          subscriptions: client.subscriptions
            .sort((left, right) => right.startsAt.localeCompare(left.startsAt))
            .slice(0, 3),
          bookings: client.bookings
            .filter(
              (booking) =>
                ["BOOKED", "ATTENDED", "MISSED", "WAITLIST"].includes(
                  booking.status,
                ) &&
                booking.trainingSession.status !== "CANCELED" &&
                booking.trainingSession.coach.userId === userId,
            )
            .sort((left, right) =>
              left.trainingSession.startsAt.localeCompare(
                right.trainingSession.startsAt,
              ),
            )
            .map((booking) => ({
              updatedAt: new Date(booking.updatedAt),
              trainingSession: {
                ...booking.trainingSession,
                startsAt: new Date(booking.trainingSession.startsAt),
              },
            })),
          workoutNotes: client.workoutNotes
            .filter(
              (note) =>
                note.isPrivate &&
                (!note.author ||
                  note.author.role === UserRole.ADMIN ||
                  note.author.role === UserRole.COACH),
            )
            .sort((left, right) => right.date.localeCompare(left.date))
            .slice(0, 5)
            .map((note) => ({
              ...note,
              date: new Date(note.date),
              updatedAt: new Date(note.updatedAt),
            })),
          files: client.files
            .filter(
              (file) =>
                !file.deletedAt && new Date(file.expiresAt).getTime() > now,
            )
            .sort((left, right) =>
              right.createdAt.localeCompare(left.createdAt),
            )
            .slice(0, 5)
            .map((file) => ({
              ...file,
              expiresAt: new Date(file.expiresAt),
            })),
        }))
        .filter(
          (client) =>
            client.group?.coach.userId === userId || client.bookings.length > 0,
        );

      return clients.map((client) => {
        const upcomingBooking =
          client.bookings.find(
            (booking) =>
              booking.trainingSession.startsAt.getTime() >= Date.now(),
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
          trainingCategory: trainingCategoryLabelFor(client.trainingCategory),
          injuryStatus: injuryStatusLabelFor(client.injuryStatus),
          injuryNotes: client.injuryNotes?.trim() ?? "",
          restrictions: client.restrictions?.trim() ?? "",
          hasInjuryAlert: injuryStatusHasAlert(client.injuryStatus),
          nextSession: nextSessionLabel,
          lastTouchpoint: describeLastTouchpoint(client),
          currentFocus: describeCurrentFocus(client),
          progressNote: describeProgressNote(
            upcomingBooking
              ? { bookings: [upcomingBooking] }
              : { bookings: [] },
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
  new SupabaseCoachClientRepository();
