import "server-only";

import { LeadStatus } from "@/lib/supabase/domain";

import type {
  AdminLeadRecord,
  AdminLeadStatus,
  InactiveLeadDirectory,
  LapsedTrialDirectory,
} from "@/lib/dashboard/admin-dashboard-data";

const LEGACY_JOIN_CREDENTIALS_PREFIX = "__join_credentials__:";
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
    case LeadStatus.TRIAL_DONE:
      return "Trial done";
    case LeadStatus.CONVERTED:
      return "Converted";
    default:
      return "Closed";
  }
}

function normalizeMessage(value: string | null) {
  const trimmed = value?.trim();
  if (!trimmed || trimmed.startsWith(LEGACY_JOIN_CREDENTIALS_PREFIX)) {
    return "No message submitted.";
  }

  return trimmed;
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
        .select("id,fullName,email,phone,source,status,createdAt,message,trialGroupId,categoryId,category:TrainingCategory(name),preferredAvailability,lostReason");
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
        records: filtered.map((lead) => ({
          id: lead.id,
          fullName: lead.fullName,
          email: lead.email ?? "No email",
          phone: lead.phone,
          source: lead.source,
          status: toLeadStatus(lead.status),
          createdAt: formatDate(new Date(lead.createdAt)),
          message: normalizeMessage(lead.message),
          trialGroupId: lead.trialGroupId,
          categoryId: lead.categoryId,
          interestedCategory: lead.category?.name ?? null,
          preferredAvailability: lead.preferredAvailability,
          lostReason: lead.lostReason,
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

  // Leads that have left the active pipeline: closed as lost or already
  // converted into a client. Ordered most-recent first.
  async listInactive(): Promise<InactiveLeadDirectory> {
    return withSupabaseFallback(async () => {
      const { data, error } = await getSupabaseServerClient()
        .from("Lead")
        .select("id,fullName,email,phone,source,status,createdAt,message,categoryId,category:TrainingCategory(name),preferredAvailability,lostReason");
      if (error) throw error;

      const inactive = data
        .filter(
          (lead) =>
            lead.status === LeadStatus.CLOSED ||
            lead.status === LeadStatus.CONVERTED,
        )
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

      const records = inactive.map((lead) => ({
        id: lead.id,
        fullName: lead.fullName,
        email: lead.email,
        phone: lead.phone,
        source: lead.source,
        outcome: (lead.status === LeadStatus.CONVERTED ? "Converted" : "Lost") as "Lost" | "Converted",
        createdAtLabel: formatDate(new Date(lead.createdAt)),
        createdAtIso: lead.createdAt,
        message: normalizeMessage(lead.message),
        interestedCategory: lead.category?.name ?? null,
        preferredAvailability: lead.preferredAvailability,
        lostReason: lead.lostReason,
      }));

      return {
        records,
        totalCount: records.length,
        lostCount: records.filter((lead) => lead.outcome === "Lost").length,
        convertedCount: records.filter((lead) => lead.outcome === "Converted")
          .length,
      };
    }, {
      records: [],
      totalCount: 0,
      lostCount: 0,
      convertedCount: 0,
    });
  }

  // Leads whose trial was marked complete (they showed up) but who haven't
  // converted or been marked lost since -- attended, then went quiet.
  // Ordered by longest-since-trial first (most overdue for a follow-up).
  async listLapsedTrials(): Promise<LapsedTrialDirectory> {
    return withSupabaseFallback(async () => {
      const { data, error } = await getSupabaseServerClient()
        .from("Lead")
        .select(
          "id,fullName,email,phone,source,updatedAt,message,categoryId,category:TrainingCategory(name),trialGroupId,trialGroup:Group!Lead_trialGroupId_fkey(name),preferredAvailability",
        )
        .eq("status", LeadStatus.TRIAL_DONE);
      if (error) throw error;

      const now = Date.now();
      const records = data
        .map((lead) => {
          const updatedAt = new Date(lead.updatedAt);
          const daysSinceTrial = Math.max(
            0,
            Math.floor((now - updatedAt.getTime()) / (24 * 60 * 60 * 1000)),
          );
          return {
            id: lead.id,
            fullName: lead.fullName,
            email: lead.email,
            phone: lead.phone,
            source: lead.source,
            categoryId: lead.categoryId,
            interestedCategory: lead.category?.name ?? null,
            trialGroupId: lead.trialGroupId,
            trialGroupName: lead.trialGroup?.name ?? null,
            daysSinceTrial,
            trialCompletedLabel: formatDate(updatedAt),
            message: normalizeMessage(lead.message),
            preferredAvailability: lead.preferredAvailability,
          };
        })
        .sort((a, b) => b.daysSinceTrial - a.daysSinceTrial);

      return { records, totalCount: records.length };
    }, { records: [], totalCount: 0 });
  }
}

export const adminLeadRepository = new AdminLeadRepository();
