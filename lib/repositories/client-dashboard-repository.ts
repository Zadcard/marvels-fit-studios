import "server-only";

import type { DashboardActivityFeedItem } from "@/components/dashboard/dashboard-activity-feed";
import {
  clientOverviewStatIcons,
  clientQuickActions,
  type ClientCoachRecord,
  type ClientOverviewData,
  type ClientSessionRecord,
  type ClientSettingsRecord,
  type ClientSubscriptionRecord,
  type ClientUpcomingSession,
} from "@/lib/dashboard/client-dashboard-data";
import { getPrisma } from "@/lib/prisma";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

function titleCase(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: Date | null | undefined) {
  return value ? dateFormatter.format(value) : "TBD";
}

function formatTime(value: Date | null | undefined) {
  return value ? timeFormatter.format(value) : "TBD";
}

function formatDateTime(value: Date | null | undefined) {
  if (!value) {
    return "Not scheduled";
  }

  return `${formatDate(value)} at ${formatTime(value)}`;
}

function getDayLabel(value: Date) {
  const today = new Date();
  const sameDay =
    value.getFullYear() === today.getFullYear() &&
    value.getMonth() === today.getMonth() &&
    value.getDate() === today.getDate();

  if (sameDay) {
    return "Today";
  }

  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const nextDay =
    value.getFullYear() === tomorrow.getFullYear() &&
    value.getMonth() === tomorrow.getMonth() &&
    value.getDate() === tomorrow.getDate();

  if (nextDay) {
    return "Tomorrow";
  }

  return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(value);
}

function inferPreferredSessionTime(startsAtValues: Date[]) {
  if (startsAtValues.length === 0) {
    return "Flexible";
  }

  const eveningCount = startsAtValues.filter((value) => value.getHours() >= 15).length;
  const morningCount = startsAtValues.filter((value) => value.getHours() < 12).length;

  if (eveningCount > morningCount) {
    return "Evenings";
  }

  if (morningCount > eveningCount) {
    return "Mornings";
  }

  return "Flexible";
}

function inferPaymentStatus(subscription: {
  status: string;
  payments: Array<{ date: Date }>;
}) {
  if (subscription.status === "ACTIVE" && subscription.payments.length > 0) {
    return "Paid";
  }

  if (subscription.status === "ACTIVE") {
    return "Due soon";
  }

  return titleCase(subscription.status);
}

function buildBenefits(subscription: {
  plan: { description: string | null; sessionsIncluded: number | null };
  isAutoRenew: boolean;
}) {
  const benefits: string[] = [];

  if (subscription.plan.sessionsIncluded) {
    benefits.push(`${subscription.plan.sessionsIncluded} sessions included each cycle`);
  }

  if (subscription.plan.description) {
    benefits.push(subscription.plan.description);
  }

  benefits.push(
    subscription.isAutoRenew ? "Auto-renew is enabled" : "Auto-renew is currently off"
  );

  return benefits;
}

type ClientDashboardQuery = Awaited<ReturnType<ClientDashboardRepository["getClientDashboardQuery"]>>;

type ClientDashboardSessionEntry = {
  id: string;
  title: string;
  type: "GROUP" | "PRIVATE";
  startsAt: Date;
  endsAt: Date;
  location: string | null;
  description: string | null;
  coachName: string;
  note: string | null;
  bookingStatus: "BOOKED" | "ATTENDED" | "MISSED" | "CANCELED" | "WAITLIST" | null;
  attendedAt: Date | null;
};

function buildClientSessionEntries(
  client: NonNullable<ClientDashboardQuery>
): ClientDashboardSessionEntry[] {
  const sessionMap = new Map<string, ClientDashboardSessionEntry>();

  for (const booking of client.bookings) {
    sessionMap.set(booking.trainingSession.id, {
      id: booking.trainingSession.id,
      title: booking.trainingSession.title,
      type: booking.trainingSession.type,
      startsAt: booking.trainingSession.startsAt,
      endsAt: booking.trainingSession.endsAt,
      location: booking.trainingSession.location,
      description: booking.trainingSession.description,
      coachName: booking.trainingSession.coach.fullName,
      note: booking.trainingSession.notes[0]?.content ?? null,
      bookingStatus: booking.status,
      attendedAt: booking.attendedAt ?? null,
    });
  }

  for (const session of client.group?.trainingSessions ?? []) {
    if (sessionMap.has(session.id)) {
      continue;
    }

    sessionMap.set(session.id, {
      id: session.id,
      title: session.title,
      type: session.type,
      startsAt: session.startsAt,
      endsAt: session.endsAt,
      location: session.location,
      description: session.description,
      coachName: session.coach.fullName,
      note: session.notes[0]?.content ?? null,
      bookingStatus: null,
      attendedAt: null,
    });
  }

  return [...sessionMap.values()].sort(
    (left, right) => left.startsAt.getTime() - right.startsAt.getTime()
  );
}

export class ClientDashboardRepository {
  private prisma = getPrisma();

  private async getClientDashboardQuery(userId: string) {
    return this.prisma.client.findUnique({
      where: { userId },
      select: {
        id: true,
        fullName: true,
        phone: true,
        membershipType: true,
        sessionsLeft: true,
        isPaid: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        group: {
          select: {
            name: true,
            coach: {
              select: {
                fullName: true,
                phone: true,
                user: {
                  select: {
                    email: true,
                  },
                },
              },
            },
            trainingSessions: {
              orderBy: [{ startsAt: "asc" }],
              select: {
                id: true,
                title: true,
                type: true,
                startsAt: true,
                endsAt: true,
                location: true,
                description: true,
                coach: {
                  select: {
                    fullName: true,
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
            },
          },
        },
        subscriptions: {
          orderBy: [{ startsAt: "desc" }],
          take: 1,
          select: {
            status: true,
            startsAt: true,
            endsAt: true,
            renewsAt: true,
            sessionsTotal: true,
            sessionsUsed: true,
            isAutoRenew: true,
            payments: {
              orderBy: [{ date: "desc" }],
              take: 3,
              select: {
                amount: true,
                currency: true,
                date: true,
              },
            },
            plan: {
              select: {
                name: true,
                description: true,
                billingCycle: true,
                sessionsIncluded: true,
                price: true,
                currency: true,
              },
            },
          },
        },
        bookings: {
          orderBy: [{ trainingSession: { startsAt: "asc" } }],
          select: {
            status: true,
            attendedAt: true,
            updatedAt: true,
            trainingSession: {
              select: {
                id: true,
                title: true,
                type: true,
                startsAt: true,
                endsAt: true,
                location: true,
                description: true,
                coach: {
                  select: {
                    fullName: true,
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
            },
          },
        },
        workoutNotes: {
          orderBy: [{ date: "desc" }],
          take: 5,
          select: {
            content: true,
            date: true,
          },
        },
      },
    });
  }

  async getOverview(userId: string): Promise<ClientOverviewData | null> {
    const client = await this.getClientDashboardQuery(userId);

    if (!client) {
      return null;
    }

    const sessionEntries = buildClientSessionEntries(client);
    const upcomingBookings = sessionEntries.filter(
      (session) => session.startsAt.getTime() >= Date.now()
    );
    const completedBookings = sessionEntries.filter(
      (session) => session.bookingStatus === "ATTENDED" || !!session.attendedAt
    );
    const activeSubscription = client.subscriptions[0] ?? null;
    const latestWorkoutNote = client.workoutNotes[0] ?? null;

    const upcomingSessions: ClientUpcomingSession[] = upcomingBookings.slice(0, 3).map((booking) => ({
      id: booking.id,
      title: booking.title,
      dayLabel: getDayLabel(booking.startsAt),
      timeLabel: formatTime(booking.startsAt),
      sessionType: booking.type === "PRIVATE" ? "Private" : "Group",
      location: booking.location ?? "Studio floor",
      coachName: booking.coachName,
      status:
        booking.startsAt.getTime() - Date.now() <= 24 * 60 * 60 * 1000
          ? "Check-in ready"
          : "Booked",
    }));

    const recentActivity: DashboardActivityFeedItem[] = [];

    if (latestWorkoutNote) {
      recentActivity.push({
        id: "client-activity-note",
        title: "Coach note updated",
        description: latestWorkoutNote.content,
        timeLabel: formatDate(latestWorkoutNote.date),
        tone: "success",
      });
    }

    if (activeSubscription?.payments[0]) {
      recentActivity.push({
        id: "client-activity-payment",
        title: "Payment recorded",
        description: `${activeSubscription.payments[0].currency} ${activeSubscription.payments[0].amount.toFixed(0)} captured for your current plan.`,
        timeLabel: formatDate(activeSubscription.payments[0].date),
        tone: "neutral",
      });
    }

    if (upcomingBookings[0]) {
      recentActivity.push({
        id: "client-activity-booking",
        title: "Next session confirmed",
        description: `${upcomingBookings[0].title} is booked with ${upcomingBookings[0].coachName}.`,
        timeLabel: formatDate(upcomingBookings[0].startsAt),
        tone: "warning",
      });
    }

    const coachName = client.group?.coach.fullName ?? upcomingBookings[0]?.coachName ?? "Unassigned coach";
    const nextTouchpoint = upcomingBookings[0]
      ? formatDateTime(upcomingBookings[0].startsAt)
      : "No session booked";

    return {
      stats: [
        {
          id: "sessions-booked",
          label: "Sessions booked",
          value: String(upcomingBookings.length).padStart(2, "0"),
          change: `${completedBookings.length} completed`,
          detail: "Live view of your upcoming and completed booked sessions.",
          note: "Database-backed",
          icon: clientOverviewStatIcons.sessions,
          tone: "accent",
        },
        {
          id: "sessions-left",
          label: "Sessions left",
          value: activeSubscription?.sessionsTotal != null
            ? String(
                Math.max(
                  activeSubscription.sessionsTotal - (activeSubscription.sessionsUsed ?? 0),
                  0
                )
              )
            : String(client.sessionsLeft),
          change: activeSubscription?.sessionsTotal != null
            ? `${activeSubscription.sessionsUsed ?? 0} used`
            : "Legacy membership counter",
          detail: "Based on your latest subscription when available.",
          note: "Database-backed",
          icon: clientOverviewStatIcons.attendance,
          tone: "success",
        },
        {
          id: "current-focus",
          label: "Current focus",
          value: latestWorkoutNote ? "Coach note" : titleCase(client.membershipType),
          change: activeSubscription?.plan.name ?? "Profile signal",
          detail: latestWorkoutNote?.content ?? "Your latest membership and coaching signals appear here.",
          note: "Database-backed",
          icon: clientOverviewStatIcons.focus,
          tone: "neutral",
        },
      ],
      upcomingSessions,
      recentActivity,
      coachSnapshot: {
        fullName: coachName,
        roleLabel: "Assigned Coach",
        specialization: client.group ? `Leads ${client.group.name}` : "Coaching assignment",
        nextTouchpoint,
        note:
          latestWorkoutNote?.content ??
          "Your latest coaching note will appear here once your coach logs progress.",
      },
      subscriptionSnapshot: {
        planName: activeSubscription?.plan.name ?? "No active plan",
        renewalLabel: activeSubscription?.renewsAt
          ? `Renews ${formatDate(activeSubscription.renewsAt)}`
          : activeSubscription?.endsAt
            ? `Ends ${formatDate(activeSubscription.endsAt)}`
            : "No renewal date set",
        paymentStatus: activeSubscription
          ? inferPaymentStatus(activeSubscription)
          : client.isPaid
            ? "Paid"
            : "Unpaid",
        benefitLine:
          activeSubscription?.plan.description ??
          `Membership type: ${titleCase(client.membershipType)}`,
      },
      quickActions: clientQuickActions,
    };
  }

  async getCoach(userId: string): Promise<ClientCoachRecord | null> {
    const client = await this.getClientDashboardQuery(userId);

    if (!client) {
      return null;
    }

    const visibleSessions = buildClientSessionEntries(client);
    const nextBooking =
      visibleSessions.find((booking) => booking.startsAt.getTime() >= Date.now()) ??
      visibleSessions[0];
    const coach = client.group?.coach;

    return {
      fullName: coach?.fullName ?? nextBooking?.coachName ?? "Unassigned coach",
      roleLabel: "Assigned Coach",
      specialization: client.group ? `Coach for ${client.group.name}` : "General coaching support",
      email: coach?.user.email ?? "Not available",
      phone: coach?.phone ?? "Not available",
      bio: coach
        ? `${coach.fullName} is currently attached to your training roster and group.`
        : "A coach will appear here once you are assigned to a group or booked into a coached session.",
      nextSession: nextBooking
        ? `${formatDateTime(nextBooking.startsAt)} - ${nextBooking.title}`
        : "No session booked",
      coachingNote:
        client.workoutNotes[0]?.content ??
        "No coaching note has been added yet.",
    };
  }

  async getSubscription(userId: string): Promise<ClientSubscriptionRecord | null> {
    const client = await this.getClientDashboardQuery(userId);

    if (!client) {
      return null;
    }

    const subscription = client.subscriptions[0];

    if (!subscription) {
      return {
        planName: "No active plan",
        status: client.isPaid ? "Paid" : "Pending",
        paymentStatus: client.isPaid ? "Paid" : "Unpaid",
        renewalDate: "No renewal date set",
        amountLabel: "EGP 0",
        billingCycle: titleCase(client.membershipType),
        benefits: ["No active subscription has been attached to this client yet."],
        note: "Subscription details will appear here once a plan is assigned.",
      };
    }

    return {
      planName: subscription.plan.name,
      status: titleCase(subscription.status),
      paymentStatus: inferPaymentStatus(subscription),
      renewalDate: subscription.renewsAt
        ? formatDate(subscription.renewsAt)
        : subscription.endsAt
          ? formatDate(subscription.endsAt)
          : "No renewal date set",
      amountLabel: `${subscription.plan.currency} ${subscription.plan.price.toFixed(0)}`,
      billingCycle: titleCase(subscription.plan.billingCycle),
      benefits: buildBenefits(subscription),
      note:
        subscription.plan.description ??
        "Current membership summary and billing state.",
    };
  }

  async getSessions(userId: string): Promise<ClientSessionRecord[]> {
    const client = await this.getClientDashboardQuery(userId);

    if (!client) {
      return [];
    }

    return buildClientSessionEntries(client).map((booking) => {
      const isPast = booking.startsAt.getTime() < Date.now();
      const status =
        booking.bookingStatus === "ATTENDED" || !!booking.attendedAt
          ? "Completed"
          : !isPast &&
              booking.startsAt.getTime() - Date.now() <= 24 * 60 * 60 * 1000
            ? "Check-in ready"
            : "Booked";

      return {
        id: booking.id,
        title: booking.title,
        sessionType: booking.type === "PRIVATE" ? "Private" : "Group",
        status,
        period: isPast ? "Past" : "Upcoming",
        dayLabel: getDayLabel(booking.startsAt),
        timeLabel: formatTime(booking.startsAt),
        location: booking.location ?? "Studio floor",
        coachName: booking.coachName,
        note:
          booking.note ??
          booking.description ??
          "No additional session note has been added yet.",
      };
    });
  }

  async getSettings(userId: string): Promise<ClientSettingsRecord | null> {
    const client = await this.getClientDashboardQuery(userId);

    if (!client) {
      return null;
    }

    const sessionTimes = buildClientSessionEntries(client)
      .filter((booking) => booking.startsAt.getTime() >= Date.now())
      .map((booking) => booking.startsAt);

    return {
      fullName: client.fullName || client.user.name || "Client",
      email: client.user.email ?? "",
      phone: client.phone ?? "",
      goalLabel:
        client.workoutNotes[0]?.content ??
        "Build steady strength and improve movement confidence.",
      preferredSessionTime: inferPreferredSessionTime(sessionTimes),
      notificationEmail: true,
      scheduleReminders: true,
      coachUpdates: true,
    };
  }
}

export const clientDashboardRepository = new ClientDashboardRepository();
