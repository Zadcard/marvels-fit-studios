import { LeadStatus, UserRole } from "@/lib/supabase/domain";

import { getSupabaseServerClient } from "@/lib/supabase/server";

export type PromoteLeadsInput = {
  emails?: string[];
  leadIds?: string[];
  includeStatuses?: LeadStatus[];
  limit?: number;
  dryRun?: boolean;
};

export type PromoteLeadResult =
  | {
      leadId: string;
      email: string | null;
      outcome: "promoted";
      details: string;
    }
  | {
      leadId: string;
      email: string | null;
      outcome: "skipped";
      details: string;
    };

export type PromoteLeadsSummary = {
  examined: number;
  promoted: number;
  skipped: number;
  results: PromoteLeadResult[];
};

const DEFAULT_INCLUDE_STATUSES: LeadStatus[] = [
  LeadStatus.TRIAL_DONE,
];

function normalizeEmails(emails?: string[]) {
  return emails
    ?.map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0);
}

export async function promoteLeadsToClients(
  input: PromoteLeadsInput = {},
): Promise<PromoteLeadsSummary> {
  const supabase = getSupabaseServerClient();
  const emails = normalizeEmails(input.emails);
  const includeStatuses = input.includeStatuses ?? DEFAULT_INCLUDE_STATUSES;

  let leadsQuery = supabase
    .from("Lead")
    .select("*")
    .in("status", includeStatuses)
    .not("trialGroupId", "is", null)
    .order("createdAt");
  if (input.leadIds?.length) {
    leadsQuery = leadsQuery.in("id", input.leadIds);
  } else if (emails?.length) {
    leadsQuery = leadsQuery.in("email", emails);
  }
  if (input.limit) leadsQuery = leadsQuery.limit(input.limit);
  const { data: leads, error: leadsError } = await leadsQuery;
  if (leadsError) throw leadsError;

  const results: PromoteLeadResult[] = [];

  for (const lead of leads) {
    const normalizedEmail = lead.email?.trim().toLowerCase() ?? null;

    const existingUserResult = normalizedEmail
      ? await supabase
          .from("User")
          .select("id, role, clientProfile:Client(id)")
          .eq("email", normalizedEmail)
          .maybeSingle()
      : { data: null, error: null };
    if (existingUserResult.error) throw existingUserResult.error;
    const existingUser = existingUserResult.data;

    if (existingUser && existingUser.role !== UserRole.CLIENT) {
      results.push({
        leadId: lead.id,
        email: normalizedEmail,
        outcome: "skipped",
        details: `Existing user has role ${existingUser.role}, so promotion was skipped to avoid changing a non-client account.`,
      });
      continue;
    }

    if (input.dryRun) {
      results.push({
        leadId: lead.id,
        email: normalizedEmail,
        outcome: "promoted",
        details: existingUser
          ? "Would confirm the client profile and mark the lead as converted."
          : "Would create a User, create a Client profile, and mark the lead as converted.",
      });
      continue;
    }

    const { data: promotion, error: promotionError } = await supabase.rpc(
      "promote_lead_to_client",
      {
        target_lead_id: lead.id,
      },
    );
    if (promotionError) throw promotionError;
    const promotionResult =
      promotion && typeof promotion === "object" && !Array.isArray(promotion)
        ? promotion
        : null;

    if (promotionResult?.outcome === "skipped") {
      results.push({
        leadId: lead.id,
        email: normalizedEmail,
        outcome: "skipped",
        details:
          promotionResult.reason === "already_converted"
            ? "This lead was already converted."
            : "Existing non-client account was preserved.",
      });
      continue;
    }

    results.push({
      leadId: lead.id,
      email: normalizedEmail,
      outcome: "promoted",
      details: existingUser
        ? "Confirmed the client profile and marked the lead as converted."
        : "Created a new client profile and marked the lead as converted.",
    });
  }

  const promoted = results.filter(
    (result) => result.outcome === "promoted",
  ).length;
  const skipped = results.length - promoted;

  return {
    examined: leads.length,
    promoted,
    skipped,
    results,
  };
}
