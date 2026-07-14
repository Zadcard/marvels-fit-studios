import "server-only";

import { LeadStatus } from "@/lib/supabase/domain";

import { readLeadCredentialClientId } from "@/lib/leads/lead-credential-metadata";
import type { AdminLeadRecord, AdminLeadStatus } from "@/lib/dashboard/admin-dashboard-data";
import { getPrisma, withPrismaFallback } from "@/lib/prisma";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function formatDate(value: Date) {
  return dateFormatter.format(value);
}

function toLeadStatus(status: LeadStatus): AdminLeadStatus {
  switch (status) {
    case LeadStatus.NEW:
      return "New";
    case LeadStatus.CONTACTED:
      return "Contacted";
    case LeadStatus.CONVERTED:
      return "Converted";
    default:
      return "Closed";
  }
}

function normalizeMessage(value: string | null) {
  if (readLeadCredentialClientId(value)) {
    return "No message submitted.";
  }

  return value?.trim() || "No message submitted.";
}

export type AdminLeadInitialOption = {
  label: string;
  count: number;
};

function normalizeListInput(input?: {
  search?: string;
  initial?: string | null;
  sort?: "asc" | "desc";
}): {
  search: string;
  initial: string | null;
  sort: "asc" | "desc";
} {
  return {
    search: input?.search?.trim() ?? "",
    initial: input?.initial?.trim().slice(0, 1).toUpperCase() ?? null,
    sort: input?.sort === "desc" ? "desc" : "asc",
  };
}

function buildLeadWhere(filters: {
  search: string;
  initial: string | null;
}) {
  return {
    AND: [
      {
        status: {
          not: LeadStatus.CONTACTED,
        },
      },
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
                email: {
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
                message: {
                  contains: filters.search,
                  mode: "insensitive" as const,
                },
              },
              {
                source: {
                  contains: filters.search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {},
    ],
  };
}

function buildInitialOptions(records: Array<{ fullName: string }>): AdminLeadInitialOption[] {
  const initialCounts = new Map<string, number>();

  for (const record of records) {
    const label = record.fullName.trim().charAt(0).toUpperCase();
    if (!/^[A-Z]$/.test(label)) {
      continue;
    }

    initialCounts.set(label, (initialCounts.get(label) ?? 0) + 1);
  }

  return Array.from({ length: 26 }, (_, index) => {
    const label = String.fromCharCode(65 + index);
    return {
      label,
      count: initialCounts.get(label) ?? 0,
    };
  }).filter((option) => option.count > 0);
}

export class AdminLeadRepository {
  private get prisma() {
    return getPrisma();
  }

  async list(input?: {
    search?: string;
    initial?: string | null;
    sort?: "asc" | "desc";
  }): Promise<{
    records: AdminLeadRecord[];
    totalCount: number;
    filteredCount: number;
    initialOptions: AdminLeadInitialOption[];
  }> {
    const filters = normalizeListInput(input);
    const where = buildLeadWhere(filters);

    return withPrismaFallback(async () => {
      const [totalCount, filteredCount, initialNameRecords, leads] =
        await Promise.all([
          this.prisma.lead.count({ where }),
          this.prisma.lead.count({ where }),
          this.prisma.lead.findMany({
            where: {
              status: {
                not: LeadStatus.CONTACTED,
              },
            },
            select: {
              fullName: true,
            },
          }),
          this.prisma.lead.findMany({
            where,
            orderBy: [{ fullName: filters.sort }, { createdAt: "desc" }],
            take: 5,
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              source: true,
              status: true,
              createdAt: true,
              message: true,
            },
          }),
        ]);

      return {
        records: leads.map((lead) => ({
          id: lead.id,
          fullName: lead.fullName,
          email: lead.email ?? "No email",
          phone: lead.phone,
          source: lead.source,
          status: toLeadStatus(lead.status),
          createdAt: formatDate(lead.createdAt),
          message: normalizeMessage(lead.message),
        })),
        totalCount,
        filteredCount,
        initialOptions: buildInitialOptions(initialNameRecords),
      };
    }, {
      records: [],
      totalCount: 0,
      filteredCount: 0,
      initialOptions: [],
    });
  }
}

export const adminLeadRepository = new AdminLeadRepository();
