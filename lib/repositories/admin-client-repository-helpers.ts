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

export type AdminClientListFilters = {
  search: string;
  initial: string | null;
  sort: "asc" | "desc";
};

type AdminClientBookingRecord = {
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
  paymentStatus: "PAID" | "UNPAID" | "DUE_SOON";
  status: ClientLifecycleStatus;
  trialOutcome: TrialOutcome | null;
  trainingCategory: TrainingCategory;
  sport: string | null;
  injuryStatus: InjuryStatus;
  injuryNotes: string | null;
  restrictions: string | null;
  createdAt: Date;
  user: {
    email: string | null;
    clientId: string | null;
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
    plan: {
      name: string;
    };
    payments: Array<{
      date: Date;
    }>;
  }>;
  payments: Array<{
    amount: number;
    date: Date;
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
                user: {
                  is: {
                    clientId: {
                      contains: filters.search,
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
  const assignedCoach =
    client.group?.coach.fullName ??
      nextBooking?.trainingSession.coach.fullName ??
      "Unassigned";

  return {
    id: client.id,
    fullName: client.fullName,
    clientId: client.user.clientId ?? "Not assigned",
    email: client.user.email ?? "No email",
    phone: client.phone ?? "No phone",
    membership,
    trainingCategory: trainingCategoryLabelFor(client.trainingCategory),
    sport: client.sport?.trim() ?? "",
    status: mapClientStatus(client.status),
    trialOutcome: trialOutcomeLabelFor(client.trialOutcome),
    paymentStatus: inferPaymentStatus(client),
    injuryStatus: injuryStatusLabelFor(client.injuryStatus),
    injuryNotes: client.injuryNotes?.trim() ?? "",
    restrictions: client.restrictions?.trim() ?? "",
    hasInjuryAlert: injuryStatusHasAlert(client.injuryStatus),
    paymentAmountLabel: client.payments[0]
      ? currencyFormatter.format(client.payments[0].amount)
      : "No payment yet",
    joinedDate: formatDate(client.createdAt),
    primaryGroupId: client.group?.id ?? null,
    primaryGroup: client.group?.name ?? "No group",
    assignedCoach,
    nextSession: nextBooking
      ? formatDateTime(nextBooking.trainingSession.startsAt)
      : "Awaiting first session",
    nextSessions: client.bookings.map(
      (booking) =>
        `${formatDateTime(booking.trainingSession.startsAt)} - ${booking.trainingSession.title}`
    ),
    progressNote: `Membership profile: ${titleCase(membership)}`,
  };
}
