import "server-only";

import type {
  AdminClientMembership,
  AdminClientRecord,
  AdminClientStatus,
  AdminPaymentStatus,
} from "@/lib/dashboard/admin-dashboard-data";
import { getPrisma } from "@/lib/prisma";

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

function inferClientStatus(record: {
  subscriptions: Array<{ status: string }>;
  bookings: Array<{ trainingSession: { startsAt: Date } }>;
}): AdminClientStatus {
  const activeSubscription = record.subscriptions[0];

  if (activeSubscription?.status === "PAUSED" || activeSubscription?.status === "EXPIRED") {
    return "Paused";
  }

  if (activeSubscription?.status === "ACTIVE") {
    return "Active";
  }

  return record.bookings.length > 0 ? "Active" : "Pending";
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

export class AdminClientRepository {
  private prisma = getPrisma();

  async list(): Promise<AdminClientRecord[]> {
    const clients = await this.prisma.client.findMany({
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        fullName: true,
        phone: true,
        isPaid: true,
        paymentStatus: true,
        createdAt: true,
        user: {
          select: {
            email: true,
          },
        },
        group: {
          select: {
            coach: {
              select: {
                fullName: true,
              },
            },
          },
        },
        subscriptions: {
          orderBy: [{ startsAt: "desc" }],
          take: 1,
          select: {
            id: true,
            status: true,
            plan: {
              select: {
                name: true,
              },
            },
            payments: {
              orderBy: [{ date: "desc" }],
              take: 1,
              select: {
                date: true,
              },
            },
          },
        },
        payments: {
          orderBy: [{ date: "desc" }],
          take: 1,
          select: {
            amount: true,
            currency: true,
            date: true,
          },
        },
        bookings: {
          orderBy: [{ trainingSession: { startsAt: "asc" } }],
          take: 3,
          select: {
            trainingSession: {
              select: {
                startsAt: true,
                title: true,
                type: true,
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
          take: 1,
          select: {
            content: true,
          },
        },
      },
    });

    return clients.map((client) => {
      const nextBooking = client.bookings[0];
      const assignedCoach =
        client.group?.coach.fullName ??
        nextBooking?.trainingSession.coach.fullName ??
        "Unassigned";

      return {
        id: client.id,
        fullName: client.fullName,
        email: client.user.email ?? "No email",
        phone: client.phone ?? "No phone",
        membership: inferMembership(client),
        status: inferClientStatus(client),
        paymentStatus: inferPaymentStatus(client),
        paymentAmountLabel: client.payments[0]
          ? currencyFormatter.format(client.payments[0].amount)
          : "No payment yet",
        joinedDate: formatDate(client.createdAt),
        assignedCoach,
        nextSession: nextBooking
          ? `${formatDateTime(nextBooking.trainingSession.startsAt)}`
          : "Awaiting first session",
        progressNote:
          client.workoutNotes[0]?.content ??
          nextBooking?.trainingSession.notes[0]?.content ??
          `Membership profile: ${titleCase(inferMembership(client))}`,
      };
    });
  }
}

export const adminClientRepository = new AdminClientRepository();
