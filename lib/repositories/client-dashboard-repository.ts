import "server-only";

import type { DashboardActivityFeedItem } from "@/components/dashboard/dashboard-activity-feed";
import {
  clientOverviewStatIcons,
  clientQuickActions,
  type ClientCoachRecord,
  type ClientFileRecord,
  type ClientOverviewData,
  type ClientPrivateNoteRecord,
  type ClientSessionRecord,
  type ClientSettingsRecord,
  type ClientSubscriptionRecord,
  type ClientUpcomingSession,
} from "@/lib/dashboard/client-dashboard-data";
import { withSupabaseFallback } from "@/lib/supabase/errors";
import { getSupabaseServerClient } from "@/lib/supabase/server";

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

  const eveningCount = startsAtValues.filter(
    (value) => value.getHours() >= 15,
  ).length;
  const morningCount = startsAtValues.filter(
    (value) => value.getHours() < 12,
  ).length;

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

  if (
    subscription.status === "ACTIVE" &&
    latestPayment &&
    subscription.renewsAt
  ) {
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
    benefits.push(
      `${subscription.plan.sessionsIncluded} sessions included each cycle`,
    );
  }

  if (subscription.plan.description) {
    benefits.push(subscription.plan.description);
  }

  benefits.push(
    subscription.isAutoRenew
      ? "Auto-renew is enabled"
      : "Auto-renew is currently off",
  );

  return benefits;
}

type ClientDashboardQuery = Awaited<
  ReturnType<ClientDashboardRepository["getClientDashboardQuery"]>
>;

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
  bookingStatus:
    "BOOKED" | "ATTENDED" | "MISSED" | "CANCELED" | "WAITLIST" | null;
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
  visibleSessions: ClientDashboardSessionEntry[],
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
        (sessionCoach.type === "PRIVATE"
          ? "Private Coaching"
          : "Coaching support"),
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
  client: NonNullable<ClientDashboardQuery>,
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
    (left, right) => left.startsAt.getTime() - right.startsAt.getTime(),
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

function mapClientFiles(client: {
  files?: Array<{
    id: string;
    name: string;
    note: string | null;
    createdAt: Date;
    expiresAt: Date;
  }>;
  group?: {
    files?: Array<{
      id: string;
      name: string;
      note: string | null;
      createdAt: Date;
      expiresAt: Date;
    }>;
  } | null;
}): ClientFileRecord[] {
  const filesById = new Map(
    [...(client.files ?? []), ...(client.group?.files ?? [])].map((file) => [
      file.id,
      file,
    ]),
  );

  return [...filesById.values()].map((file) => ({
    id: file.id,
    name: file.name,
    note: file.note ?? "No note added.",
    uploadedAtLabel: formatDate(file.createdAt),
    expiresAtLabel: formatDate(file.expiresAt),
    downloadHref: `/api/files/${file.id}/download`,
  }));
}

function mapClientPrivateNotes(client: {
  workoutNotes?: Array<{
    id: string;
    content: string;
    date: Date;
    updatedAt?: Date | null;
  }>;
}): ClientPrivateNoteRecord[] {
  return (client.workoutNotes ?? []).map((note) => ({
    id: note.id,
    content: note.content,
    updatedAtLabel: formatDate(note.updatedAt ?? note.date),
  }));
}

export class ClientDashboardRepository {
  private async getClientDashboardQuery(userId: string) {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("Client")
      .select(
        `
        id, fullName, phone, membershipType, sessionsLeft, isPaid, createdAt,
        preferences:ClientPreferences(goalLabel, preferredSessionTime),
        user:User(id, name, email),
        group:Group(name,
          files:File(id, name, note, createdAt, expiresAt, deletedAt),
          coach:Coach(fullName, phone, user:User(email)),
          trainingSessions:TrainingSession(id, title, type, status, startsAt,
            endsAt, location, description,
            coach:Coach(fullName, phone, user:User(email)))),
        subscriptions:ClientSubscription(id, status, startsAt, endsAt, renewsAt,
          updatedAt, customPrice, sessionsTotal, sessionsUsed, isAutoRenew,
          payments:Payment(id, amount, currency, date, note, createdAt),
          plan:SubscriptionPlan(name, description, billingCycle,
            sessionsIncluded, price, currency)),
        bookings:SessionBooking(status, attendedAt, updatedAt,
          trainingSession:TrainingSession(id, title, type, status, startsAt,
            endsAt, location, description,
            coach:Coach(fullName, phone, user:User(email)))),
        files:File(id, name, note, createdAt, expiresAt, deletedAt),
        workoutNotes:WorkoutNote(id, content, date, updatedAt, isPrivate, authorId)
      `,
      )
      .eq("userId", userId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;

    const now = Date.now();
    const normalizeFile = (file: (typeof data.files)[number]) => ({
      ...file,
      createdAt: new Date(file.createdAt),
      expiresAt: new Date(file.expiresAt),
    });
    const normalizeSession = (
      session: (typeof data.bookings)[number]["trainingSession"],
    ) => ({
      ...session,
      startsAt: new Date(session.startsAt),
      endsAt: new Date(session.endsAt),
    });

    return {
      ...data,
      createdAt: new Date(data.createdAt),
      preferences: data.preferences[0] ?? null,
      files: data.files
        .filter(
          (file) => !file.deletedAt && new Date(file.expiresAt).getTime() > now,
        )
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
        .map(normalizeFile),
      workoutNotes: data.workoutNotes
        .filter((note) => note.isPrivate && note.authorId === userId)
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
        .map((note) => ({
          ...note,
          date: new Date(note.date),
          updatedAt: new Date(note.updatedAt),
        })),
      subscriptions: data.subscriptions
        .sort(
          (left, right) =>
            right.updatedAt.localeCompare(left.updatedAt) ||
            right.startsAt.localeCompare(left.startsAt),
        )
        .slice(0, 1)
        .map((subscription) => ({
          ...subscription,
          startsAt: new Date(subscription.startsAt),
          endsAt: subscription.endsAt ? new Date(subscription.endsAt) : null,
          renewsAt: subscription.renewsAt
            ? new Date(subscription.renewsAt)
            : null,
          updatedAt: new Date(subscription.updatedAt),
          payments: subscription.payments
            .sort((left, right) => right.date.localeCompare(left.date))
            .map((payment) => ({ ...payment, date: new Date(payment.date) })),
        })),
      bookings: data.bookings
        .filter((booking) =>
          ["SCHEDULED", "COMPLETED"].includes(booking.trainingSession.status),
        )
        .map((booking) => ({
          ...booking,
          attendedAt: booking.attendedAt ? new Date(booking.attendedAt) : null,
          updatedAt: new Date(booking.updatedAt),
          trainingSession: normalizeSession(booking.trainingSession),
        }))
        .sort(
          (left, right) =>
            left.trainingSession.startsAt.getTime() -
            right.trainingSession.startsAt.getTime(),
        ),
      group: data.group
        ? {
            ...data.group,
            files: data.group.files
              .filter(
                (file) =>
                  !file.deletedAt && new Date(file.expiresAt).getTime() > now,
              )
              .sort((left, right) =>
                right.createdAt.localeCompare(left.createdAt),
              )
              .map(normalizeFile),
            trainingSessions: data.group.trainingSessions
              .filter((session) =>
                ["SCHEDULED", "COMPLETED"].includes(session.status),
              )
              .map(normalizeSession)
              .sort(
                (left, right) =>
                  left.startsAt.getTime() - right.startsAt.getTime(),
              ),
          }
        : null,
    };
  }

  async getOverview(userId: string): Promise<ClientOverviewData | null> {
    return withSupabaseFallback(async () => {
      const client = await this.getClientDashboardQuery(userId);

      if (!client) {
        return null;
      }

      const sessionEntries = buildClientSessionEntries(client);
      const upcomingBookings = sessionEntries.filter(isUpcomingVisibleSession);
      const completedBookings = sessionEntries.filter(isAttendedSession);
      const activeSubscription = client.subscriptions[0] ?? null;
      const primaryCoach = resolvePrimaryCoach(client, sessionEntries);
      const activeFiles = mapClientFiles(client);
      const privateNotes = mapClientPrivateNotes(client);

      const upcomingSessions: ClientUpcomingSession[] = upcomingBookings
        .slice(0, 3)
        .map((booking) => ({
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

      if (activeFiles.length > 0) {
        recentActivity.unshift({
          id: "client-activity-files",
          title: `${activeFiles.length} file${activeFiles.length === 1 ? "" : "s"} available`,
          description:
            "Your coach uploaded downloadable files for your training.",
          timeLabel: activeFiles[0].uploadedAtLabel,
          tone: "neutral",
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
            value:
              activeSubscription?.sessionsTotal != null
                ? String(
                    Math.max(
                      activeSubscription.sessionsTotal -
                        (activeSubscription.sessionsUsed ?? 0),
                      0,
                    ),
                  )
                : String(client.sessionsLeft),
            change:
              activeSubscription?.sessionsTotal != null
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
            detail:
              "Your membership, attendance, and next session details appear here.",
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
        activeFiles,
        privateNotes,
      };
    }, null);
  }

  async getCoach(userId: string): Promise<ClientCoachRecord | null> {
    return withSupabaseFallback(async () => {
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
        coachingNote: nextBooking
          ? `${nextBooking.title} is your next planned touchpoint with ${primaryCoach.fullName}.`
          : "Your coach details and next touchpoint will appear here once a session is booked.",
      };
    }, null);
  }

  async getSubscription(
    userId: string,
  ): Promise<ClientSubscriptionRecord | null> {
    return withSupabaseFallback(async () => {
      const client = await this.getClientDashboardQuery(userId);

      if (!client) {
        return null;
      }

      const subscription = client.subscriptions[0] ?? null;

      if (!subscription) {
        return {
          planName: "No active plan",
          status: client.isPaid ? "Paid" : "Pending",
          paymentStatus: client.isPaid ? "Paid" : "Unpaid",
          renewalDate: "No renewal date set",
          amountLabel: "EGP 0",
          billingCycle: titleCase(client.membershipType),
          benefits: [
            "No active subscription has been attached to this client yet.",
          ],
          note: "Subscription details will appear here once a plan is assigned.",
          paymentHistory: [],
        };
      }

      const { data: ledger, error: ledgerError } = await getSupabaseServerClient()
        .from("BillingLedgerEntry")
        .select("id, paymentId, receiptNumber")
        .eq("clientId", client.id)
        .eq("type", "PAYMENT");
      if (ledgerError) throw ledgerError;
      const ledgerByPayment = new Map(
        ledger.filter((entry) => entry.paymentId).map((entry) => [entry.paymentId, entry]),
      );
      const paymentHistory = subscription.payments.slice(0, 5);
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
          subscription.customPrice ??
          subscription.plan.price
        ).toFixed(0)}`,
        billingCycle: titleCase(subscription.plan.billingCycle),
        benefits: buildBenefits(subscription),
        note:
          subscription.plan.description ??
          "Current membership summary and billing state.",
        paymentHistory: paymentHistory.map((payment) => {
          const receipt = ledgerByPayment.get(payment.id);
          return {
            id: payment.id,
            amountLabel: formatCurrency(payment.amount, payment.currency),
            dateLabel: formatDate(payment.date),
            note: payment.note ?? "Payment recorded.",
            receiptNumber: receipt?.receiptNumber ?? "Receipt pending",
            receiptHref: receipt ? `/api/receipts/${receipt.id}` : "",
          };
        }),
      };
    }, null);
  }

  async getSessions(userId: string): Promise<ClientSessionRecord[]> {
    return withSupabaseFallback(async () => {
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
                      booking.startsAt.getTime() - Date.now() <=
                        24 * 60 * 60 * 1000
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
    }, []);
  }

  async getSettings(userId: string): Promise<ClientSettingsRecord | null> {
    return withSupabaseFallback(async () => {
      const client = await this.getClientDashboardQuery(userId);

      if (!client) {
        return null;
      }

      const preferences = "preferences" in client ? client.preferences : null;
      const sessionTimes = buildClientSessionEntries(client)
        .filter((booking) => booking.startsAt.getTime() >= Date.now())
        .map((booking) => booking.startsAt);

      return {
        fullName: client.fullName || client.user.name || "Client",
        email: client.user.email ?? "",
        phone: client.phone ?? "",
        goalLabel: preferences?.goalLabel ?? defaultClientGoal,
        preferredSessionTime:
          preferences?.preferredSessionTime ??
          inferPreferredSessionTime(sessionTimes),
      };
    }, null);
  }
}

export const clientDashboardRepository = new ClientDashboardRepository();
