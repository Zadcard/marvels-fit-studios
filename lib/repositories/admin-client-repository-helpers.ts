import type {
  AdminClientInitialOption,
  AdminClientMembership,
  AdminClientRecord,
  AdminClientStatus,
  AdminPaymentStatus,
} from "@/lib/dashboard/admin-dashboard-data";
import {
  injuryStatusHasAlert,
  injuryStatusLabelFor,
  lifecycleStatusLabelFor,
  trainingCategoryLabelFor,
  trialOutcomeLabelFor,
} from "@/lib/dashboard/client-domain-labels";
import { computeSubscriptionUrgency } from "@/lib/dashboard/subscription-status";
import type {
  ClientLifecycleStatus,
  InjuryStatus,
  TrainingCategory,
  TrialOutcome,
} from "@/lib/supabase/domain";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EGP",
  maximumFractionDigits: 0,
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

export type AdminClientListFilters = {
  search: string;
  initial: string | null;
  sort: "asc" | "desc";
};

type AdminClientBookingRecord = {
  id: string;
  status: "ATTENDED" | "LATE" | "MISSED" | "EXCUSED" | "BOOKED" | "WAITLIST" | "NO_SHOW" | "CANCELED";
  trainingSession: {
    startsAt: Date;
    title: string;
    type: "GROUP" | "PRIVATE";
    coach: {
      fullName: string;
    };
  };
};

export type AdminClientListRecord = {
  id: string;
  fullName: string;
  phone: string | null;
  sessionsLeft: number;
  paymentStatus: "PAID" | "UNPAID" | "DUE_SOON";
  status: ClientLifecycleStatus;
  trialOutcome: TrialOutcome | null;
  categoryId: string | null;
  category: { id: string; name: string } | null;
  trainingCategory: TrainingCategory;
  sport: string | null;
  injuryStatus: InjuryStatus;
  injuryNotes: string | null;
  restrictions: string | null;
  createdAt: Date;
  user: {
    email: string | null;
  };
  group: {
    id: string;
    name: string;
    coach: {
      fullName: string;
    };
  } | null;
  subscriptions: Array<{
    id: string;
    status: string;
    renewsAt: Date | null;
    sessionsTotal: number | null;
    plan: {
      name: string;
    };
    payments: Array<{
      date: Date;
    }>;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    currency: string;
    date: Date;
    method: string | null;
  }>;
  receipts: Array<{
    id: string;
    receiptNumber: string;
    occurredAt: Date;
    amount: number;
    currency: string;
    method: string | null;
  }>;
  bookings: AdminClientBookingRecord[];
};

function formatDate(value: Date | null | undefined) {
  return value ? dateFormatter.format(value) : "TBD";
}

function formatDateTime(value: Date | null | undefined) {
  return value ? dateTimeFormatter.format(value) : "Not booked";
}

function titleCase(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function paymentMethodLabel(value: string | null) {
  switch (value) {
    case "INSTA_PAY":
      return "InstaPay";
    case "VISA":
      return "Visa";
    case "CASH":
      return "Cash";
    default:
      return "Not recorded";
  }
}

function inferMembership(record: {
  subscriptions: Array<{ plan: { name: string } }>;
  bookings: Array<{ trainingSession: { type: "GROUP" | "PRIVATE" } }>;
}): AdminClientMembership {
  const labels = record.subscriptions
    .map((subscription) => subscription.plan.name.toLowerCase())
    .join(" ");
  const hasPrivate = record.bookings.some(
    (booking) => booking.trainingSession.type === "PRIVATE"
  );
  const hasGroup = record.bookings.some(
    (booking) => booking.trainingSession.type === "GROUP"
  );

  if (labels.includes("hybrid") || (hasPrivate && hasGroup)) {
    return "Hybrid";
  }

  if (labels.includes("private") || hasPrivate) {
    return "Private Coaching";
  }

  return "Group Membership";
}

function mapClientStatus(status: ClientLifecycleStatus): AdminClientStatus {
  return lifecycleStatusLabelFor(status);
}

function inferPaymentStatus(record: {
  paymentStatus: "PAID" | "UNPAID" | "DUE_SOON";
  subscriptions: Array<{
    status: string;
    payments: Array<{ date: Date }>;
  }>;
}): AdminPaymentStatus {
  if (record.paymentStatus === "PAID") {
    return "Paid";
  }

  if (record.paymentStatus === "DUE_SOON") {
    return "Due soon";
  }

  const activeSubscription = record.subscriptions[0];

  if (activeSubscription?.payments.length) {
    return "Paid";
  }

  if (activeSubscription?.status === "ACTIVE") {
    return "Due soon";
  }

  return "Unpaid";
}

export function normalizeAdminClientListFilters(input?: {
  search?: string;
  initial?: string | null;
  sort?: "asc" | "desc";
}): AdminClientListFilters {
  return {
    search: input?.search?.trim() ?? "",
    initial: input?.initial?.trim().slice(0, 1).toUpperCase() ?? null,
    sort: input?.sort === "desc" ? "desc" : "asc",
  };
}

export function buildAdminClientWhere(filters: AdminClientListFilters) {
  return {
    AND: [
      filters.initial
        ? {
            fullName: {
              startsWith: filters.initial,
              mode: "insensitive" as const,
            },
          }
        : {},
      filters.search
        ? {
            OR: [
              {
                fullName: {
                  contains: filters.search,
                  mode: "insensitive" as const,
                },
              },
              {
                phone: {
                  contains: filters.search,
                },
              },
              {
                user: {
                  is: {
                    email: {
                      contains: filters.search,
                      mode: "insensitive" as const,
                    },
                  },
                },
              },
              {
                group: {
                  is: {
                    name: {
                      contains: filters.search,
                      mode: "insensitive" as const,
                    },
                  },
                },
              },
            ],
          }
        : {},
    ],
  };
}

export function buildInitialOptions(
  initialNameRecords: Array<{ fullName: string }>
): AdminClientInitialOption[] {
  const initialCounts = new Map<string, number>();

  for (const record of initialNameRecords) {
    const initialLabel = record.fullName.trim().charAt(0).toUpperCase();

    if (!/^[A-Z]$/.test(initialLabel)) {
      continue;
    }

    initialCounts.set(initialLabel, (initialCounts.get(initialLabel) ?? 0) + 1);
  }

  return Array.from({ length: 26 }, (_, index) => {
    const label = String.fromCharCode(65 + index);
    return {
      label,
      count: initialCounts.get(label) ?? 0,
    };
  }).filter((option) => option.count > 0);
}

export function mapAdminClientRecord(client: AdminClientListRecord): AdminClientRecord {
  const nextBooking = client.bookings[0];
  const membership = inferMembership(client);
  const groups = client.group
    ? [{ id: client.group.id, name: client.group.name, coachName: client.group.coach.fullName }]
    : [];
  const assignedCoach =
    client.group?.coach.fullName ??
      nextBooking?.trainingSession.coach.fullName ??
      "Unassigned";
  const { subscriptionStatus, daysRemaining } = computeSubscriptionUrgency(
    client.subscriptions[0] ?? null
  );

  return {
    id: client.id,
    fullName: client.fullName,
    email: client.user.email ?? "No email",
    phone: client.phone ?? "No phone",
    membership,
    categoryId: client.categoryId,
    trainingCategory: client.category?.name ?? trainingCategoryLabelFor(client.trainingCategory),
    sport: client.sport?.trim() ?? "",
    status: mapClientStatus(client.status),
    trialOutcome: trialOutcomeLabelFor(client.trialOutcome),
    paymentStatus: inferPaymentStatus(client),
    subscriptionStatus,
    subscriptionDaysRemaining: daysRemaining,
    injuryStatus: injuryStatusLabelFor(client.injuryStatus),
    injuryNotes: client.injuryNotes?.trim() ?? "",
    restrictions: client.restrictions?.trim() ?? "",
    hasInjuryAlert: injuryStatusHasAlert(client.injuryStatus, client.injuryNotes),
    paymentAmountLabel: client.payments[0]
      ? currencyFormatter.format(client.payments[0].amount)
      : "No payment yet",
    sessionsLeft: client.sessionsLeft,
    sessionsTotal: client.subscriptions[0]?.sessionsTotal ?? client.sessionsLeft,
    joinedDate: formatDate(client.createdAt),
    groups,
    assignedCoach,
    nextSession: nextBooking
      ? formatDateTime(nextBooking.trainingSession.startsAt)
      : "Awaiting first session",
    nextSessions: client.bookings.map(
      (booking) =>
        `${formatDateTime(booking.trainingSession.startsAt)} - ${booking.trainingSession.title}`
    ),
    receipts: client.receipts.map((receipt) => ({
      id: receipt.id,
      receiptNumber: receipt.receiptNumber,
      amountLabel: currencyFormatter.format(receipt.amount),
      dateLabel: formatDate(receipt.occurredAt),
      method: paymentMethodLabel(receipt.method),
      href: `/api/receipts/${receipt.id}`,
    })),
    attendanceHistory: (client.bookings ?? []).map((booking) => ({
      id: booking.id,
      status: booking.status,
      sessionTitle: booking.trainingSession.title,
      sessionType: booking.trainingSession.type === "PRIVATE" ? "Private" : "Group",
      coachName: booking.trainingSession.coach.fullName,
      dateLabel: formatDate(booking.trainingSession.startsAt),
      timeLabel: timeFormatter.format(booking.trainingSession.startsAt),
    })),
    progressNote: `Membership profile: ${titleCase(membership)}`,
  };
}
