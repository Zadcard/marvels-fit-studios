import "server-only";

import type { CoachOverviewData } from "@/lib/dashboard/coach-overview-data";
import { coachClientRepository } from "@/lib/repositories/coach-client-repository";
import { coachSessionRepository } from "@/lib/repositories/coach-session-repository";

export class CoachOverviewRepository {
  async getForCoachUserId(userId: string): Promise<CoachOverviewData> {
    const [sessions, clients] = await Promise.all([
      coachSessionRepository.listForCoachUserId(userId),
      coachClientRepository.listForCoachUserId(userId),
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
          label: "Waitlist blocks",
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
          change: `${readySessions.length} active blocks`,
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
