import "server-only";

import type {
  AdminClientInitialOption,
  AdminClientMembership,
  AdminClientRecord,
  AdminClientStatus,
  AdminPaymentStatus,
} from "@/lib/dashboard/admin-dashboard-data";
import { getAssignedCoachLabel } from "@/lib/coaches/placeholder-coaches";
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

function mapClientStatus(
  status: "ACTIVE" | "PENDING" | "PAUSED"
): AdminClientStatus {
  switch (status) {
    case "ACTIVE":
      return "Active";
    case "PAUSED":
      return "Paused";
    default:
      return "Pending";
  }
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

  async list(input?: {
    search?: string;
    initial?: string | null;
    sort?: "asc" | "desc";
  }): Promise<{
    records: AdminClientRecord[];
    totalCount: number;
    filteredCount: number;
    initialOptions: AdminClientInitialOption[];
  }> {
    const search = input?.search?.trim() ?? "";
    const initial = input?.initial?.trim().slice(0, 1).toUpperCase() ?? null;
    const sort = input?.sort === "desc" ? "desc" : "asc";
    const scheduleBlockDelegate = this.prisma.scheduleBlock as
      | typeof this.prisma.scheduleBlock
      | undefined;
    const where = {
      AND: [
        initial
          ? {
              fullName: {
                startsWith: initial,
                mode: "insensitive" as const,
              },
            }
          : {},
        search
          ? {
              OR: [
                {
                  fullName: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
                {
                  phone: {
                    contains: search,
                  },
                },
                {
                  user: {
                    is: {
                      email: {
                        contains: search,
                        mode: "insensitive" as const,
                      },
                    },
                  },
                },
                {
                  user: {
                    is: {
                      clientId: {
                        contains: search,
                      },
                    },
                  },
                },
                {
                  group: {
                    is: {
                      name: {
                        contains: search,
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
    const [totalCount, filteredCount, initialNameRecords, clients] = await Promise.all([
      this.prisma.client.count(),
      this.prisma.client.count({ where }),
      this.prisma.client.findMany({
        select: {
          fullName: true,
        },
      }),
      this.prisma.client.findMany({
        where,
        orderBy: [{ fullName: sort }],
        select: {
          id: true,
          fullName: true,
          phone: true,
          paymentStatus: true,
          status: true,
          createdAt: true,
          user: {
            select: {
              email: true,
              clientId: true,
            },
          },
          group: {
            select: {
              id: true,
              name: true,
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
              date: true,
            },
          },
          bookings: {
            where: {
              status: {
                in: ["BOOKED", "ATTENDED", "MISSED", "WAITLIST"],
              },
              trainingSession: {
                status: {
                  not: "CANCELED",
                },
              },
            },
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
                },
              },
            },
          },
        },
      }),
    ]);
    const scheduleBlockRecords = scheduleBlockDelegate
      ? await scheduleBlockDelegate.findMany({
          orderBy: [{ startsOn: "asc" }],
          select: {
            id: true,
            title: true,
            roster: {
              select: {
                clientId: true,
              },
            },
          },
        })
      : [];
    const scheduleBlocks = Array.isArray(scheduleBlockRecords)
      ? scheduleBlockRecords
      : [];
    const firstBlockByClientId = new Map<string, { id: string; title: string }>();

    for (const block of scheduleBlocks) {
      for (const rosterEntry of block.roster) {
        if (!firstBlockByClientId.has(rosterEntry.clientId)) {
          firstBlockByClientId.set(rosterEntry.clientId, {
            id: block.id,
            title: block.title,
          });
        }
      }
    }

    const initialCounts = new Map<string, number>();

    for (const record of initialNameRecords) {
      const initialLabel = record.fullName.trim().charAt(0).toUpperCase();

      if (!/^[A-Z]$/.test(initialLabel)) {
        continue;
      }

      initialCounts.set(initialLabel, (initialCounts.get(initialLabel) ?? 0) + 1);
    }

    const records = clients.map((client) => {
      const primaryBlock = firstBlockByClientId.get(client.id);
      const nextBooking = client.bookings[0];
      const assignedCoach = getAssignedCoachLabel(
        client.group?.coach.fullName ??
          nextBooking?.trainingSession.coach.fullName ??
          null
      );

      return {
        id: client.id,
        fullName: client.fullName,
        clientId: client.user.clientId ?? "Not assigned",
        email: client.user.email ?? "No email",
        phone: client.phone ?? "No phone",
        membership: inferMembership(client),
        status: mapClientStatus(client.status),
        paymentStatus: inferPaymentStatus(client),
        paymentAmountLabel: client.payments[0]
          ? currencyFormatter.format(client.payments[0].amount)
          : "No payment yet",
        joinedDate: formatDate(client.createdAt),
        primaryGroupId: client.group?.id ?? null,
        primaryGroup: client.group?.name ?? "No group",
        primaryBlockId: primaryBlock?.id ?? null,
        primaryBlock: primaryBlock?.title ?? "No recurring block",
        assignedCoach,
        nextSession: nextBooking
          ? `${formatDateTime(nextBooking.trainingSession.startsAt)}`
          : "Awaiting first session",
        nextSessions: client.bookings.map(
          (booking) =>
            `${formatDateTime(booking.trainingSession.startsAt)} - ${booking.trainingSession.title}`
        ),
        progressNote:
          `Membership profile: ${titleCase(inferMembership(client))}`,
      };
    });

    const initialOptions = Array.from({ length: 26 }, (_, index) => {
      const label = String.fromCharCode(65 + index);
      return {
        label,
        count: initialCounts.get(label) ?? 0,
      };
    }).filter((option) => option.count > 0);

    return {
      records,
      totalCount,
      filteredCount,
      initialOptions,
    };
  }
}

export const adminClientRepository = new AdminClientRepository();
