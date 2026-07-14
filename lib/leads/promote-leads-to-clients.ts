import bcryptjs from "bcryptjs";
import { LeadStatus, UserRole } from "@/lib/supabase/domain";

import { readLeadCredentialClientId } from "@/lib/leads/lead-credential-metadata";
import { clientIdGenerator } from "@/lib/services/client-id-generator";
import { passwordGenerator } from "@/lib/services/password-generator";
import { getPrisma } from "../prisma";

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
  LeadStatus.NEW,
  LeadStatus.CONTACTED,
];

function normalizeEmails(emails?: string[]) {
  return emails
    ?.map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0);
}

export async function promoteLeadsToClients(
  input: PromoteLeadsInput = {}
): Promise<PromoteLeadsSummary> {
  const prisma = getPrisma();
  const emails = normalizeEmails(input.emails);
  const includeStatuses = input.includeStatuses ?? DEFAULT_INCLUDE_STATUSES;

  const leads = await prisma.lead.findMany({
    where: {
      ...(input.leadIds && input.leadIds.length > 0
        ? {
            id: {
              in: input.leadIds,
            },
          }
        : emails && emails.length > 0
        ? {
            email: {
              in: emails,
            },
          }
        : {
            status: {
              in: includeStatuses,
            },
          }),
    },
    orderBy: [{ createdAt: "asc" }],
    ...(input.limit ? { take: input.limit } : {}),
  });

  const results: PromoteLeadResult[] = [];

  for (const lead of leads) {
    const normalizedEmail = lead.email?.trim().toLowerCase() ?? null;
    const reservedClientId = readLeadCredentialClientId(lead.message);

    const existingUser = normalizedEmail
      ? await prisma.user.findUnique({
          where: { email: normalizedEmail },
          include: {
            clientProfile: true,
          },
        })
      : null;

    if (
      existingUser &&
      existingUser.role !== UserRole.CLIENT &&
      !existingUser.clientProfile
    ) {
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
    const temporaryPassword = passwordGenerator.generatePassword(generatedClientId);

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

    const hashedPassword = lead.passwordHash
      ? lead.passwordHash
      : await bcryptjs.hash(temporaryPassword, 10);

    await prisma.$transaction(async (tx) => {
      const user =
        existingUser ??
        (await tx.user.create({
          data: {
            email: normalizedEmail,
            name: lead.fullName,
            clientId: generatedClientId,
            password: hashedPassword,
            mustChangePassword: true,
            role: UserRole.CLIENT,
          },
        }));

      if (existingUser) {
        await tx.user.update({
          where: { id: user.id },
          data: {
            name: user.name ?? lead.fullName,
            email: user.email ?? normalizedEmail,
            clientId: user.clientId ?? generatedClientId,
            password: hashedPassword,
            mustChangePassword: true,
            role: UserRole.CLIENT,
          },
        });
      }

      if (!existingUser?.clientProfile) {
        await tx.client.create({
          data: {
            fullName: lead.fullName,
            phone: lead.phone,
            userId: user.id,
          },
        });
      }

      await tx.lead.update({
        where: { id: lead.id },
        data: {
          status: LeadStatus.CONVERTED,
        },
      });
    });

    results.push({
      leadId: lead.id,
      email: normalizedEmail,
      outcome: "promoted",
      details: existingUser
        ? "Issued fresh credentials, confirmed the client profile, and marked the lead as converted."
        : "Created a new client account, generated credentials, and marked the lead as converted.",
      clientId: generatedClientId,
      temporaryPassword,
    });
  }

  const promoted = results.filter((result) => result.outcome === "promoted").length;
  const skipped = results.length - promoted;

  return {
    examined: leads.length,
    promoted,
    skipped,
    results,
  };
}
