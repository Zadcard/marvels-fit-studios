import bcryptjs from "bcryptjs";
import { LeadStatus, UserRole } from "@/lib/supabase/domain";

import { readLeadCredentialClientId } from "@/lib/leads/lead-credential-metadata";
import { generateTemporaryPassword } from "@/lib/auth/temporary-password";
import { clientIdGenerator } from "@/lib/services/client-id-generator";
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
      clientId?: string;
      temporaryPassword?: string;
    }
  | {
      leadId: string;
      email: string | null;
      outcome: "skipped";
      details: string;
      clientId?: string;
      temporaryPassword?: string;
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
    const reservedClientId = readLeadCredentialClientId(lead.message);

    const existingUserResult = normalizedEmail
      ? await supabase
          .from("User")
          .select("id, role, clientId, clientProfile:Client(id)")
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

    const generatedClientId =
      reservedClientId ??
      existingUser?.clientId ??
      (await clientIdGenerator.getNextAvailableId());
    const temporaryPassword = generateTemporaryPassword();

    if (input.dryRun) {
      results.push({
        leadId: lead.id,
        email: normalizedEmail,
        outcome: "promoted",
        details: existingUser
          ? "Would issue a fresh temporary password, confirm the client profile, and mark the lead as converted."
          : "Would create a User, create a Client profile, generate credentials, and mark the lead as converted.",
        clientId: generatedClientId,
        temporaryPassword,
      });
      continue;
    }

    // Promotion always issues a fresh one-time credential. Reusing a landing
    // form hash would make the clear-text credential shown to the admin false.
    const hashedPassword = await bcryptjs.hash(temporaryPassword, 12);

    const { data: promotion, error: promotionError } = await supabase.rpc(
      "promote_lead_to_client",
      {
        generated_client_id: generatedClientId,
        hashed_password: hashedPassword,
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
            ? "This lead was already converted. No credentials were changed."
            : "Existing non-client account was preserved.",
      });
      continue;
    }

    const credentialsIssued = promotionResult?.credentialsIssued !== false;
    const promotedClientId =
      typeof promotionResult?.clientId === "string"
        ? promotionResult.clientId
        : generatedClientId;

    results.push({
      leadId: lead.id,
      email: normalizedEmail,
      outcome: "promoted",
      details: credentialsIssued
        ? existingUser
          ? "Issued temporary credentials, created the missing client profile, and marked the lead as converted."
          : "Created a new client account, generated credentials, and marked the lead as converted."
        : "Linked the lead to the existing client account without changing its credentials.",
      clientId: promotedClientId,
      temporaryPassword: credentialsIssued ? temporaryPassword : undefined,
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
