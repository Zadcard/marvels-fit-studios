import "server-only";

import type { AdminClientInitialOption, AdminClientRecord } from "@/lib/dashboard/admin-dashboard-data";
import { getPrisma, withPrismaFallback } from "@/lib/prisma";
import {
  buildAdminClientWhere,
  buildInitialOptions,
  mapAdminClientRecord,
  normalizeAdminClientListFilters,
  type AdminClientListRecord,
} from "@/lib/repositories/admin-client-repository-helpers";

export class AdminClientRepository {
  private get prisma() {
    return getPrisma();
  }

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
    const filters = normalizeAdminClientListFilters(input);
    const where = buildAdminClientWhere(filters);
    const [totalCount, filteredCount, initialNameRecords, clients] =
      await Promise.all([
        withPrismaFallback(() => this.prisma.client.count(), 0),
        withPrismaFallback(() => this.prisma.client.count({ where }), 0),
        withPrismaFallback(
          () =>
            this.prisma.client.findMany({
              select: {
                fullName: true,
              },
            }),
          []
        ),
        withPrismaFallback<AdminClientListRecord[]>(
          () =>
            this.prisma.client.findMany({
              where,
              orderBy: [{ fullName: filters.sort }],
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
          []
        ),
      ]);
    const records = clients.map((client) => mapAdminClientRecord(client));
    const initialOptions = buildInitialOptions(initialNameRecords);

    return {
      records,
      totalCount,
      filteredCount,
      initialOptions,
    };
  }
}

export const adminClientRepository = new AdminClientRepository();
