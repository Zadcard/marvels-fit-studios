import "server-only";

import { LeadStatus } from "@/lib/supabase/domain";

import { readLeadCredentialClientId } from "@/lib/leads/lead-credential-metadata";
import type { AdminLeadRecord, AdminLeadStatus } from "@/lib/dashboard/admin-dashboard-data";
import { withSupabaseFallback } from "@/lib/supabase/errors";
import { getSupabaseServerClient } from "@/lib/supabase/server";

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
    return withSupabaseFallback(async () => {
      const { data, error } = await getSupabaseServerClient()
        .from("Lead")
        .select("id,fullName,email,phone,source,status,createdAt,message")
        .neq("status", LeadStatus.CONTACTED);
      if (error) throw error;

      const search = filters.search.toLowerCase();
      const filtered = data
        .filter((lead) => {
          const matchesInitial =
            !filters.initial ||
            lead.fullName.toUpperCase().startsWith(filters.initial);
          const matchesSearch =
            !search ||
            [lead.fullName, lead.email, lead.phone, lead.message, lead.source].some(
              (value) => value?.toLowerCase().includes(search)
            );
          return matchesInitial && matchesSearch;
        })
        .sort((a, b) => {
          const byName = a.fullName.localeCompare(b.fullName);
          if (byName !== 0) return filters.sort === "desc" ? -byName : byName;
          return b.createdAt.localeCompare(a.createdAt);
        });

      return {
        records: filtered.slice(0, 5).map((lead) => ({
          id: lead.id,
          fullName: lead.fullName,
          email: lead.email ?? "No email",
          phone: lead.phone,
          source: lead.source,
          status: toLeadStatus(lead.status),
          createdAt: formatDate(new Date(lead.createdAt)),
          message: normalizeMessage(lead.message),
        })),
        totalCount: data.length,
        filteredCount: filtered.length,
        initialOptions: buildInitialOptions(data),
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
