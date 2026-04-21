import "server-only";

import { Prisma } from "@prisma/client";
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

type TimedAdminRecentActivityItem = AdminRecentActivityItem & {
  occurredAt: number;
};

function isRecoverablePrismaError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2021" || error.code === "P2022")
  );
}

async function withPrismaFallback<T>(operation: Promise<T>, fallback: T) {
  try {
    return await operation;
  } catch (error) {
    if (isRecoverablePrismaError(error)) {
      return fallback;
    }

    throw error;
  }
}

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
      withPrismaFallback(this.prisma.client.count(), 0),
      withPrismaFallback(this.prisma.coach.count(), 0),
      withPrismaFallback(
        this.prisma.trainingSession.count({
          where: {
            status: {
              not: "CANCELED",
            },
            startsAt: {
              gte: now,
              lte: weekEnd,
            },
          },
        }),
        0
      ),
      withPrismaFallback(
        this.prisma.payment.aggregate({
          _sum: { amount: true },
          where: {
            date: { gte: startOfMonth },
          },
        }),
        { _sum: { amount: null } }
      ),
      withPrismaFallback(
        this.prisma.lead.count({
          where: {
            status: {
              in: ["NEW", "CONTACTED"],
            },
          },
        }),
        0
      ),
      withPrismaFallback(
        this.prisma.trainingSession.findMany({
          where: {
            status: "SCHEDULED",
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
        []
      ),
      withPrismaFallback(
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
        []
      ),
      withPrismaFallback(
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
        []
      ),
      withPrismaFallback(
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
        []
      ),
      withPrismaFallback(
        this.prisma.clientSubscription.count({
          where: {
            status: "ACTIVE",
          },
        }),
        0
      ),
      withPrismaFallback(
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
        0
      ),
      withPrismaFallback(
        this.prisma.sessionBooking.count({
          where: {
            status: "ATTENDED",
            trainingSession: {
              status: {
                not: "CANCELED",
              },
            },
          },
        }),
        0
      ),
    ]);

    const stats: AdminOverviewStat[] = [
      {
        id: "members",
        label: "Members",
        value: numberFormatter.format(totalMembers),
        change: `${activeLeadCount} in join requests`,
        detail: "Clients currently active in the roster.",
        note: "Roster live",
        icon: Users,
        tone: "accent",
      },
      {
        id: "coaches",
        label: "Coach coverage",
        value: numberFormatter.format(coachCount),
        change: "Coverage ready",
        detail: "Coaches currently available for scheduling.",
        note: "Roster live",
        icon: ShieldUser,
        tone: "success",
      },
      {
        id: "sessions",
        label: "Week sessions",
        value: numberFormatter.format(sessionsThisWeek),
        change: `${upcomingSessions.length} in next 48h`,
        detail: "Scheduled group and private sessions.",
        note: "Schedule live",
        icon: Dumbbell,
        tone: "neutral",
      },
      {
        id: "revenue",
        label: "Month revenue",
        value: currencyFormatter.format(revenueAggregate._sum.amount ?? 0),
        change: `${activeSubscriptions} active plans`,
        detail: "Payments captured this month.",
        note: "Billing live",
        icon: CircleDollarSign,
        tone: revenueAggregate._sum.amount ? "success" : "warning",
      },
    ];

    const upcomingSessionCards: AdminUpcomingSession[] = upcomingSessions.map(
      (session) => {
        const bookedSeats = session.bookings.length;
        const capacity = session.capacity ?? 1;

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

    const recentActivityItems = [
      ...latestLeads.map((lead) => ({
        id: `lead-${lead.id}`,
        title: "Lead queue",
        description: `${lead.fullName} moved to ${lead.status.toLowerCase()}.`,
        timeLabel: getRelativeLabel(lead.createdAt),
        occurredAt: lead.createdAt.getTime(),
        tone: lead.status === "NEW" ? ("success" as const) : ("warning" as const),
      })),
      ...latestPayments.map((payment) => ({
        id: `payment-${payment.id}`,
        title: "Payment cleared",
        description: `${payment.client.fullName} paid ${payment.currency} ${payment.amount.toFixed(0)}.`,
        timeLabel: getRelativeLabel(payment.date),
        occurredAt: payment.date.getTime(),
        tone: "success" as const,
      })),
      ...latestNotes.map((note) => ({
        id: `note-${note.id}`,
        title: "Session note",
        description: `${note.author.name ?? "A coach"} updated ${note.trainingSession.title}.`,
        timeLabel: getRelativeLabel(note.createdAt),
        occurredAt: note.createdAt.getTime(),
        tone: "neutral" as const,
      })),
    ] satisfies TimedAdminRecentActivityItem[];

    const recentActivity: AdminRecentActivityItem[] = recentActivityItems
      .sort((a, b) => b.occurredAt - a.occurredAt)
      .slice(0, 6)
      .map(({ occurredAt, ...item }) => {
        void occurredAt;
        return item;
      });

    const quickActions: AdminQuickAction[] = activeLeadCount > 0
      ? [
          {
            id: "action-1",
            label: "Clear join requests",
            description: "Review waiting requests and convert the ready ones.",
            ctaLabel: "Review",
            href: "/admin/join-requests",
            icon: ClipboardPlus,
            emphasis: "primary",
          },
          {
            id: "action-2",
            label: "Add client",
            description: "Open the roster and add a new client record.",
            ctaLabel: "Open",
            href: "/admin/clients",
            icon: UserPlus,
            emphasis: "secondary",
          },
          {
            id: "action-3",
            label: "Create session",
            description: "Build the next session block or adjust a live one.",
            ctaLabel: "Launch",
            href: "/admin/sessions",
            icon: CalendarPlus2,
            emphasis: "secondary",
          },
          {
            id: "action-4",
            label: "Check coach coverage",
            description: "Review coach load before adding more capacity.",
            ctaLabel: "Review",
            href: "/admin/coaches",
            icon: ShieldUser,
            emphasis: "secondary",
          },
        ]
      : [
          {
            id: "action-1",
            label: "Add client",
            description: "Open the roster and add a new client record.",
            ctaLabel: "Open",
            href: "/admin/clients",
            icon: UserPlus,
            emphasis: "primary",
          },
          {
            id: "action-2",
            label: "Create session",
            description: "Build the next session block or adjust a live one.",
            ctaLabel: "Launch",
            href: "/admin/sessions",
            icon: CalendarPlus2,
            emphasis: "secondary",
          },
          {
            id: "action-3",
            label: "Check coach coverage",
            description: "Review coach load before adding more capacity.",
            ctaLabel: "Review",
            href: "/admin/coaches",
            icon: ShieldUser,
            emphasis: "secondary",
          },
          {
            id: "action-4",
            label: "Review package pressure",
            description: "Check renewal pressure before client sessions run out.",
            ctaLabel: "Open",
            href: "/admin/clients",
            icon: CircleDollarSign,
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
        description: "Join requests waiting for follow-up or approval.",
      },
      {
        id: "snapshot-2",
        label: "Plan demand",
        value: `${groupShare}%`,
        description: "Active plans currently leaning group-first.",
      },
      {
        id: "snapshot-3",
        label: "Energy note",
        value: attendedBookings >= 5 ? "Strong" : "Steady",
        description: "Attendance signal from recorded attended bookings.",
      },
      {
        id: "snapshot-4",
        label: "Focus next",
        value: activeLeadCount > 0 ? "Requests" : "Sessions",
        description:
          activeLeadCount > 0
            ? "Clear the waiting join requests before opening more capacity."
            : "Sessions are the main operational surface right now.",
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
