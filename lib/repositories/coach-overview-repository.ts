import "server-only";

import type { CoachOverviewData } from "@/lib/dashboard/coach-overview-data";
import type { CoachClientRecord, CoachClientStatus } from "@/lib/dashboard/coach-client-record";
import { withSupabaseFallback } from "@/lib/supabase/errors";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { coachSessionRepository } from "@/lib/repositories/coach-session-repository";

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function formatDateTimeLabel(value: Date) {
  return dateTimeFormatter.format(value);
}

function determineOverviewClientStatus(client: {
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

  return nextUpcomingSession ? "On track" : "Needs check-in";
}

async function listOverviewClientsForCoachUserId(
  userId: string
): Promise<Array<Pick<CoachClientRecord, "id" | "fullName" | "currentFocus" | "nextSession" | "status">>> {
  return withSupabaseFallback(async () => {
    const { data, error } = await getSupabaseServerClient()
      .from("Client")
      .select(
        "id,fullName,createdAt,group:Group(coach:Coach(userId)),bookings:SessionBooking(status,trainingSession:TrainingSession(startsAt,status,coach:Coach(userId))),workoutNotes:WorkoutNote(content,date)"
      )
      .order("fullName");
    if (error) throw error;

    const clients = data
      .filter(
        (client) =>
          client.group?.coach.userId === userId ||
          client.bookings.some(
            (booking) =>
              ["BOOKED", "ATTENDED", "MISSED", "WAITLIST"].includes(
                booking.status
              ) &&
              booking.trainingSession.status !== "CANCELED" &&
              booking.trainingSession.coach.userId === userId
          )
      )
      .map((client) => ({
        ...client,
        createdAt: new Date(client.createdAt),
        bookings: client.bookings
          .filter(
            (booking) =>
              ["BOOKED", "ATTENDED", "MISSED", "WAITLIST"].includes(
                booking.status
              ) &&
              booking.trainingSession.status !== "CANCELED" &&
              booking.trainingSession.coach.userId === userId
          )
          .sort((a, b) =>
            a.trainingSession.startsAt.localeCompare(b.trainingSession.startsAt)
          )
          .map((booking) => ({
            trainingSession: {
              startsAt: new Date(booking.trainingSession.startsAt),
            },
          })),
        workoutNotes: client.workoutNotes
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, 1)
          .map(({ content }) => ({ content })),
      }));

    return clients.map((client) => {
      const upcomingBooking =
        client.bookings.find(
          (booking) => booking.trainingSession.startsAt.getTime() >= Date.now()
        ) ?? client.bookings[0];

      return {
        id: client.id,
        fullName: client.fullName,
        currentFocus:
          client.workoutNotes[0]?.content ??
          "Assigned to your coaching roster. Add a progress note after the next session.",
        nextSession: upcomingBooking
          ? formatDateTimeLabel(upcomingBooking.trainingSession.startsAt)
          : "Not booked",
        status: determineOverviewClientStatus(client),
      };
    });
  }, []);
}

export class CoachOverviewRepository {
  async getForCoachUserId(userId: string): Promise<CoachOverviewData> {
    const [sessions, clients] = await Promise.all([
      coachSessionRepository.listForCoachUserId(userId),
      listOverviewClientsForCoachUserId(userId),
    ]);

    const readySessions = sessions.filter((session) => session.status === "Ready");
    const waitlistSessions = sessions.filter((session) => session.status === "Waitlist");
    const attentionClients = clients.filter(
      (client) => client.status === "Needs check-in"
    );

    return {
      stats: [
        {
          id: "sessions-today",
          label: "Sessions in view",
          value: String(sessions.length).padStart(2, "0"),
          change: `${readySessions.length} ready`,
          detail: "Live count of sessions currently assigned to this coach.",
          note: "Database-backed",
          icon: "calendar-clock",
          tone: "accent",
        },
        {
          id: "clients-active",
          label: "Assigned clients",
          value: String(clients.length).padStart(2, "0"),
          change: `${attentionClients.length} need follow-up`,
          detail: "Clients currently connected to this coach through groups or session bookings.",
          note: "Database-backed",
          icon: "users-round",
          tone: "success",
        },
        {
          id: "check-ins",
          label: "Waitlist sessions",
          value: String(waitlistSessions.length).padStart(2, "0"),
          change: waitlistSessions.length > 0 ? "Needs review" : "Clear",
          detail: "Sessions currently at capacity or flagged by demand.",
          note: "Database-backed",
          icon: "clock-3",
          tone: waitlistSessions.length > 0 ? "warning" : "neutral",
        },
        {
          id: "consistency",
          label: "Roster pace",
          value: attentionClients.length > 0 ? "Watch" : "Steady",
          change: `${readySessions.length} active sessions`,
          detail: "Quick coaching signal based on ready sessions and clients needing attention.",
          note: "Database-backed",
          icon: "target",
          tone: attentionClients.length > 0 ? "warning" : "neutral",
        },
      ],
      upcomingSessions: sessions.slice(0, 3).map((session) => ({
        id: session.id,
        title: session.title,
        dayLabel: session.dayLabel,
        timeLabel: session.timeLabel,
        location: session.location,
        sessionType: session.sessionType,
        status: session.status,
        occupancyLabel: session.rosterLabel,
      })),
      clientSpotlights: clients.slice(0, 3).map((client) => ({
        id: client.id,
        fullName: client.fullName,
        focus: client.currentFocus,
        nextSession: client.nextSession,
        momentum: client.status,
      })),
      recentActivity: [
        ...(sessions[0]
          ? [
              {
                id: `coach-session-${sessions[0].id}`,
                title: "Next session loaded",
                description: `${sessions[0].title} is on your live coach board.`,
                timeLabel: `${sessions[0].dayLabel}, ${sessions[0].timeLabel}`,
                tone: "success" as const,
              },
            ]
          : []),
        ...(attentionClients[0]
          ? [
              {
                id: `coach-client-${attentionClients[0].id}`,
                title: "Client needs check-in",
                description: `${attentionClients[0].fullName} needs a follow-up before the next session.`,
                timeLabel: attentionClients[0].nextSession,
                tone: "warning" as const,
              },
            ]
          : []),
        ...(waitlistSessions[0]
          ? [
              {
                id: `coach-waitlist-${waitlistSessions[0].id}`,
                title: "Session at capacity",
                description: `${waitlistSessions[0].title} is currently showing waitlist pressure.`,
                timeLabel: `${waitlistSessions[0].dayLabel}, ${waitlistSessions[0].timeLabel}`,
                tone: "neutral" as const,
              },
            ]
          : []),
      ],
      todaysPlan: sessions.slice(0, 3).map((session) => ({
        id: session.id,
        timeLabel: session.timeLabel,
        title: session.title,
        note: session.note,
      })),
    };
  }
}

export const coachOverviewRepository = new CoachOverviewRepository();
