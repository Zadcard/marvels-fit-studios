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
import { isMissingCustomPriceColumn } from "@/lib/custom-price-compat";
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

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

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

const defaultClientGoal =
  "Build steady strength and improve movement confidence.";

function inferPaymentStatus(subscription: {
  status: string;
  renewsAt?: Date | null;
  payments: Array<{ date: Date }>;
}) {
  const latestPayment = subscription.payments[0]?.date ?? null;

  if (subscription.status === "CANCELED") {
    return "Canceled";
  }

  if (subscription.status === "PAUSED" || subscription.status === "EXPIRED") {
    return "Paused";
  }

  if (subscription.status === "ACTIVE" && latestPayment && subscription.renewsAt) {
    const activeWindowStart = new Date(subscription.renewsAt);
    activeWindowStart.setUTCDate(activeWindowStart.getUTCDate() - 45);

    if (latestPayment.getTime() >= activeWindowStart.getTime()) {
      return "Paid";
    }
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
  coachEmail: string | null;
  coachPhone: string | null;
  coachSpecialization: string | null;
  bookingStatus: "BOOKED" | "ATTENDED" | "MISSED" | "CANCELED" | "WAITLIST" | null;
  attendedAt: Date | null;
};

type ClientPrimaryCoach = {
  fullName: string;
  email: string;
  phone: string;
  specialization: string;
  bio: string;
};

function resolvePrimaryCoach(
  client: NonNullable<ClientDashboardQuery>,
  visibleSessions: ClientDashboardSessionEntry[]
): ClientPrimaryCoach {
  const sessionCoach =
    visibleSessions.find(isUpcomingVisibleSession) ?? visibleSessions[0];

  if (sessionCoach) {
    return {
      fullName: sessionCoach.coachName,
      email: sessionCoach.coachEmail ?? "Not available",
      phone: sessionCoach.coachPhone ?? "Not available",
      specialization:
        sessionCoach.coachSpecialization ??
        (sessionCoach.type === "PRIVATE" ? "Private Coaching" : "Coaching support"),
      bio: `Assigned through ${sessionCoach.title}.`,
    };
  }

  if (client.group?.coach) {
    return {
      fullName: client.group.coach.fullName,
      email: client.group.coach.user.email ?? "Not available",
      phone: client.group.coach.phone ?? "Not available",
      specialization: "Coaching support",
      bio: `${client.group.coach.fullName} is currently attached to your training roster and group.`,
    };
  }

  return {
    fullName: "Unassigned coach",
    email: "Not available",
    phone: "Not available",
    specialization: "General coaching support",
    bio: "A coach will appear here once you are assigned to a group or booked into a coached session.",
  };
}

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
      coachEmail: booking.trainingSession.coach.user.email,
      coachPhone: booking.trainingSession.coach.phone,
      coachSpecialization:
        booking.trainingSession.type === "PRIVATE"
          ? "Private Coaching"
          : "Coaching support",
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
      coachEmail: session.coach.user.email,
      coachPhone: session.coach.phone,
      coachSpecialization:
        session.type === "PRIVATE" ? "Private Coaching" : "Coaching support",
      bookingStatus: null,
      attendedAt: null,
    });
  }

  return [...sessionMap.values()].sort(
    (left, right) => left.startsAt.getTime() - right.startsAt.getTime()
  );
}

function isCanceledSession(entry: ClientDashboardSessionEntry) {
  return entry.bookingStatus === "CANCELED";
}

function isAttendedSession(entry: ClientDashboardSessionEntry) {
  return entry.bookingStatus === "ATTENDED" || !!entry.attendedAt;
}

function isUpcomingVisibleSession(entry: ClientDashboardSessionEntry) {
  return entry.startsAt.getTime() >= Date.now() && !isCanceledSession(entry);
}

export class ClientDashboardRepository {
  private prisma = getPrisma();

  private async getClientDashboardQueryWithShape(
    userId: string,
    includeCustomPrice: boolean
  ) {
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
        preferences: {
          select: {
            goalLabel: true,
            preferredSessionTime: true,
            notificationEmail: true,
            scheduleReminders: true,
            coachUpdates: true,
          },
        },
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
              where: {
                status: {
                  in: ["SCHEDULED", "COMPLETED"],
                },
              },
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
                    phone: true,
                    user: {
                      select: {
                        email: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        subscriptions: {
          orderBy: [{ updatedAt: "desc" }, { startsAt: "desc" }],
          take: 1,
          select: {
            status: true,
            startsAt: true,
            endsAt: true,
            renewsAt: true,
            updatedAt: true,
            ...(includeCustomPrice ? { customPrice: true } : {}),
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
          where: {
            status: {
              in: ["BOOKED", "ATTENDED", "MISSED", "CANCELED", "WAITLIST"],
            },
            trainingSession: {
              status: {
                in: ["SCHEDULED", "COMPLETED"],
              },
            },
          },
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
                    phone: true,
                    user: {
                      select: {
                        email: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  private async getClientDashboardQuery(userId: string) {
    try {
      return await this.getClientDashboardQueryWithShape(userId, true);
    } catch (error) {
      if (isMissingCustomPriceColumn(error)) {
        return this.getClientDashboardQueryWithShape(userId, false);
      }

      throw error;
    }
  }

  private async getSubscriptionWithShape(
    clientId: string,
    includeCustomPrice: boolean
  ) {
    return this.prisma.clientSubscription.findFirst({
      where: {
        clientId,
      },
      orderBy: [{ updatedAt: "desc" }, { startsAt: "desc" }],
      select: {
        id: true,
        status: true,
        startsAt: true,
        endsAt: true,
        renewsAt: true,
        ...(includeCustomPrice ? { customPrice: true } : {}),
        sessionsTotal: true,
        sessionsUsed: true,
        isAutoRenew: true,
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
    });
  }

  private async getSubscriptionRecord(clientId: string) {
    try {
      return await this.getSubscriptionWithShape(clientId, true);
    } catch (error) {
      if (isMissingCustomPriceColumn(error)) {
        return this.getSubscriptionWithShape(clientId, false);
      }

      throw error;
    }
  }

  async getOverview(userId: string): Promise<ClientOverviewData | null> {
    const client = await this.getClientDashboardQuery(userId);

    if (!client) {
      return null;
    }

    const sessionEntries = buildClientSessionEntries(client);
    const upcomingBookings = sessionEntries.filter(isUpcomingVisibleSession);
    const completedBookings = sessionEntries.filter(isAttendedSession);
    const activeSubscription = client.subscriptions[0] ?? null;
    const primaryCoach = resolvePrimaryCoach(client, sessionEntries);

    const upcomingSessions: ClientUpcomingSession[] = upcomingBookings.slice(0, 3).map((booking) => ({
      id: booking.id,
      title: booking.title,
      dayLabel: getDayLabel(booking.startsAt),
      timeLabel: formatTime(booking.startsAt),
      sessionType: booking.type === "PRIVATE" ? "Private" : "Group",
      location: booking.location ?? "Studio floor",
      coachName: booking.coachName,
      status:
        booking.bookingStatus === "WAITLIST"
          ? "Waitlist"
          : booking.startsAt.getTime() - Date.now() <= 24 * 60 * 60 * 1000
            ? "Check-in ready"
            : "Booked",
    }));

    const recentActivity: DashboardActivityFeedItem[] = [];

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
          value: titleCase(client.membershipType),
          change: activeSubscription?.plan.name ?? "Profile signal",
          detail: "Your membership, attendance, and next session details appear here.",
          note: "Database-backed",
          icon: clientOverviewStatIcons.focus,
          tone: "neutral",
        },
      ],
      upcomingSessions,
      recentActivity,
      coachSnapshot: {
        fullName: primaryCoach.fullName,
        roleLabel: "Assigned Coach",
        specialization: primaryCoach.specialization,
        nextTouchpoint,
        note: primaryCoach.bio,
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
      visibleSessions.find(isUpcomingVisibleSession) ?? visibleSessions[0];
    const primaryCoach = resolvePrimaryCoach(client, visibleSessions);

    return {
      fullName: primaryCoach.fullName,
      roleLabel: "Assigned Coach",
      specialization: primaryCoach.specialization,
      email: primaryCoach.email,
      phone: primaryCoach.phone,
      bio: primaryCoach.bio,
      nextSession: nextBooking
        ? `${formatDateTime(nextBooking.startsAt)} - ${nextBooking.title}`
        : "No session booked",
      coachingNote:
        nextBooking
          ? `${nextBooking.title} is your next planned touchpoint with ${primaryCoach.fullName}.`
          : "Your coach details and next touchpoint will appear here once a session is booked.",
    };
  }

  async getSubscription(userId: string): Promise<ClientSubscriptionRecord | null> {
    const client = await this.getClientDashboardQuery(userId);

    if (!client) {
      return null;
    }

    const subscription = await this.getSubscriptionRecord(client.id);

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
        paymentHistory: [],
      };
    }

    const paymentHistory = await this.prisma.payment.findMany({
      where: {
        clientSubscriptionId: subscription.id,
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 5,
      select: {
        id: true,
        amount: true,
        currency: true,
        date: true,
        note: true,
      },
    });
    const latestPayment = paymentHistory[0] ?? null;

    return {
      planName: subscription.plan.name,
      status: titleCase(subscription.status),
      paymentStatus: inferPaymentStatus({
        status: subscription.status,
        renewsAt: subscription.renewsAt,
        payments: latestPayment ? [{ date: latestPayment.date }] : [],
      }),
      renewalDate: subscription.renewsAt
        ? formatDate(subscription.renewsAt)
        : subscription.endsAt
          ? formatDate(subscription.endsAt)
          : "No renewal date set",
      amountLabel: `${latestPayment?.currency ?? subscription.plan.currency} ${(
        latestPayment?.amount ??
        ("customPrice" in subscription ? subscription.customPrice : null) ??
        subscription.plan.price
      ).toFixed(0)}`,
      billingCycle: titleCase(subscription.plan.billingCycle),
      benefits: buildBenefits(subscription),
      note:
        subscription.plan.description ??
        "Current membership summary and billing state.",
      paymentHistory: paymentHistory.map((payment) => ({
        id: payment.id,
        amountLabel: formatCurrency(payment.amount, payment.currency),
        dateLabel: formatDate(payment.date),
        note: payment.note ?? "Payment recorded.",
      })),
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
        booking.bookingStatus === "CANCELED"
          ? "Cancelled"
          : booking.bookingStatus === "MISSED"
            ? "You missed"
            : isAttendedSession(booking)
              ? "You attended"
              : booking.bookingStatus === "WAITLIST"
                ? "Waitlist"
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
          booking.description ??
          "Session details and attendance updates will appear here.",
      };
    });
  }

  async getSettings(userId: string): Promise<ClientSettingsRecord | null> {
    const client = await this.getClientDashboardQuery(userId);

    if (!client) {
      return null;
    }

    const preferences = client.preferences;
    const sessionTimes = buildClientSessionEntries(client)
      .filter((booking) => booking.startsAt.getTime() >= Date.now())
      .map((booking) => booking.startsAt);

    return {
      fullName: client.fullName || client.user.name || "Client",
      email: client.user.email ?? "",
      phone: client.phone ?? "",
      goalLabel: preferences?.goalLabel ?? defaultClientGoal,
      preferredSessionTime:
        preferences?.preferredSessionTime ?? inferPreferredSessionTime(sessionTimes),
      notificationEmail: preferences?.notificationEmail ?? true,
      scheduleReminders: preferences?.scheduleReminders ?? true,
      coachUpdates: preferences?.coachUpdates ?? true,
    };
  }
}

export const clientDashboardRepository = new ClientDashboardRepository();
