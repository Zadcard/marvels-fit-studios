import "server-only";

import {
  CalendarPlus2,
  CircleDollarSign,
  ClipboardPlus,
  Dumbbell,
  ShieldUser,
  UserPlus,
  Users,
} from "lucide-react";

import type {
  AdminOverviewStat,
  AdminQuickAction,
  AdminRecentActivityItem,
  AdminStudioSnapshot,
  AdminUpcomingSession,
} from "@/lib/mocks/admin-overview";
import { getPrisma } from "@/lib/prisma";

const numberFormatter = new Intl.NumberFormat("en-US");
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EGP",
  maximumFractionDigits: 0,
});
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});
const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

type AdminOverviewData = {
  stats: AdminOverviewStat[];
  upcomingSessions: AdminUpcomingSession[];
  recentActivity: AdminRecentActivityItem[];
  quickActions: AdminQuickAction[];
  studioSnapshot: AdminStudioSnapshot[];
};

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

  return dateFormatter.format(date);
}

function getRelativeLabel(date: Date) {
  const diffMinutes = Math.max(
    1,
    Math.round((Date.now() - date.getTime()) / 60000)
  );

  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hr ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} day ago`;
}

export class AdminOverviewRepository {
  private prisma = getPrisma();

  async getOverview(): Promise<AdminOverviewData> {
    const now = new Date();
    const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      totalMembers,
      coachCount,
      sessionsThisWeek,
      revenueAggregate,
      activeLeadCount,
      upcomingSessions,
      latestLeads,
      latestPayments,
      latestNotes,
      activeSubscriptions,
      privateSubscriptions,
      attendedBookings,
    ] = await Promise.all([
      this.prisma.client.count(),
      this.prisma.coach.count(),
      this.prisma.trainingSession.count({
        where: {
          startsAt: {
            gte: now,
            lte: weekEnd,
          },
        },
      }),
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          date: { gte: startOfMonth },
        },
      }),
      this.prisma.lead.count({
        where: {
          status: {
            in: ["NEW", "CONTACTED"],
          },
        },
      }),
      this.prisma.trainingSession.findMany({
        where: {
          startsAt: {
            gte: now,
            lte: in48Hours,
          },
        },
        orderBy: { startsAt: "asc" },
        take: 4,
        select: {
          id: true,
          title: true,
          startsAt: true,
          type: true,
          location: true,
          capacity: true,
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
      this.prisma.lead.findMany({
        orderBy: { createdAt: "desc" },
        take: 2,
        select: {
          id: true,
          fullName: true,
          status: true,
          createdAt: true,
        },
      }),
      this.prisma.payment.findMany({
        orderBy: { date: "desc" },
        take: 2,
        select: {
          id: true,
          amount: true,
          currency: true,
          date: true,
          client: {
            select: {
              fullName: true,
            },
          },
        },
      }),
      this.prisma.sessionNote.findMany({
        orderBy: { createdAt: "desc" },
        take: 2,
        select: {
          id: true,
          createdAt: true,
          author: {
            select: {
              name: true,
            },
          },
          trainingSession: {
            select: {
              title: true,
            },
          },
        },
      }),
      this.prisma.clientSubscription.count({
        where: {
          status: "ACTIVE",
        },
      }),
      this.prisma.clientSubscription.count({
        where: {
          status: "ACTIVE",
          plan: {
            name: {
              contains: "private",
              mode: "insensitive",
            },
          },
        },
      }),
      this.prisma.sessionBooking.count({
        where: {
          status: "ATTENDED",
        },
      }),
    ]);

    const stats: AdminOverviewStat[] = [
      {
        id: "members",
        label: "Total members",
        value: numberFormatter.format(totalMembers),
        change: `${activeLeadCount} active leads`,
        detail: "Live client roster from the database.",
        note: "Database-backed",
        icon: Users,
        tone: "accent",
      },
      {
        id: "coaches",
        label: "Active coaches",
        value: numberFormatter.format(coachCount),
        change: "Roster coverage",
        detail: "Coach accounts currently available in the system.",
        note: "Database-backed",
        icon: ShieldUser,
        tone: "success",
      },
      {
        id: "sessions",
        label: "Sessions this week",
        value: numberFormatter.format(sessionsThisWeek),
        change: `${upcomingSessions.length} in next 48h`,
        detail: "Scheduled sessions across group and private coaching.",
        note: "Database-backed",
        icon: Dumbbell,
        tone: "neutral",
      },
      {
        id: "revenue",
        label: "Revenue this month",
        value: currencyFormatter.format(revenueAggregate._sum.amount ?? 0),
        change: `${activeSubscriptions} active plans`,
        detail: "Payments recorded this month.",
        note: "Database-backed",
        icon: CircleDollarSign,
        tone: revenueAggregate._sum.amount ? "success" : "warning",
      },
    ];

    const upcomingSessionCards: AdminUpcomingSession[] = upcomingSessions.map(
      (session) => {
        const bookedSeats = session.bookings.length;
        const capacity = session.capacity ?? (session.type === "PRIVATE" ? 1 : 1);

        return {
          id: session.id,
          dayLabel: getDayLabel(session.startsAt),
          timeLabel: timeFormatter.format(session.startsAt),
          name: session.title,
          coachName: session.coach.fullName,
          location: session.location ?? "Studio floor",
          sessionType: session.type === "PRIVATE" ? "Private" : "Group",
          bookedSeats,
          capacity,
          status:
            session.capacity !== null && bookedSeats >= session.capacity
              ? "Waitlist forming"
              : bookedSeats === 0
                ? "Needs follow-up"
                : "On track",
        };
      }
    );

    const recentActivity: AdminRecentActivityItem[] = [
      ...latestLeads.map((lead) => ({
        id: `lead-${lead.id}`,
        title: "Lead updated",
        description: `${lead.fullName} is marked ${lead.status.toLowerCase()}.`,
        timeLabel: getRelativeLabel(lead.createdAt),
        tone: lead.status === "NEW" ? ("success" as const) : ("warning" as const),
      })),
      ...latestPayments.map((payment) => ({
        id: `payment-${payment.id}`,
        title: "Payment recorded",
        description: `${payment.client.fullName} paid ${payment.currency} ${payment.amount.toFixed(0)}.`,
        timeLabel: getRelativeLabel(payment.date),
        tone: "success" as const,
      })),
      ...latestNotes.map((note) => ({
        id: `note-${note.id}`,
        title: "Coach note added",
        description: `${note.author.name ?? "A coach"} updated ${note.trainingSession.title}.`,
        timeLabel: getRelativeLabel(note.createdAt),
        tone: "neutral" as const,
      })),
    ]
      .sort((a, b) => a.timeLabel.localeCompare(b.timeLabel))
      .slice(0, 6);

    const quickActions: AdminQuickAction[] = [
      {
        id: "action-1",
        label: "Add new client",
        description: "Open the roster and review live client records.",
        ctaLabel: "Open",
        href: "/admin/clients",
        icon: UserPlus,
        emphasis: "primary",
      },
      {
        id: "action-2",
        label: "Create session",
        description: "Open the sessions workspace and plan the next block.",
        ctaLabel: "Launch",
        href: "/admin/sessions",
        icon: CalendarPlus2,
        emphasis: "secondary",
      },
      {
        id: "action-3",
        label: "Assign coach",
        description: "Review the live coach roster and current load.",
        ctaLabel: "Review",
        href: "/admin/coaches",
        icon: ShieldUser,
        emphasis: "secondary",
      },
      {
        id: "action-4",
        label: "Review leads",
        description: "Approve incoming leads and convert the right people to clients.",
        ctaLabel: "Open",
        href: "/admin/leads",
        icon: ClipboardPlus,
        emphasis: "secondary",
      },
    ];

    const groupShare =
      activeSubscriptions === 0
        ? 0
        : Math.round(
            ((activeSubscriptions - privateSubscriptions) / activeSubscriptions) *
              100
          );

    const studioSnapshot: AdminStudioSnapshot[] = [
      {
        id: "snapshot-1",
        label: "Onboarding queue",
        value: numberFormatter.format(activeLeadCount),
        description: "Leads waiting for follow-up or approval.",
      },
      {
        id: "snapshot-2",
        label: "Plan demand",
        value: `${groupShare}%`,
        description: "Share of active subscriptions leaning group-first.",
      },
      {
        id: "snapshot-3",
        label: "Energy note",
        value: attendedBookings >= 5 ? "Strong" : "Steady",
        description: "Attendance signal based on recorded attended bookings.",
      },
      {
        id: "snapshot-4",
        label: "Focus next",
        value: activeLeadCount > 0 ? "Leads" : "Sessions",
        description:
          activeLeadCount > 0
            ? "There are still leads waiting for admin action."
            : "The schedule is the main operational surface right now.",
      },
    ];

    return {
      stats,
      upcomingSessions: upcomingSessionCards,
      recentActivity,
      quickActions,
      studioSnapshot,
    };
  }
}

export const adminOverviewRepository = new AdminOverviewRepository();
