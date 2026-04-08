import { LeadStatus, UserRole } from "@prisma/client";

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

    if (!normalizedEmail) {
      results.push({
        leadId: lead.id,
        email: lead.email,
        outcome: "skipped",
        details: "Lead has no email, so it cannot become a login account.",
      });
      continue;
    }

    if (!lead.passwordHash) {
      results.push({
        leadId: lead.id,
        email: normalizedEmail,
        outcome: "skipped",
        details: "Lead has no password hash, so credentials login would not work.",
      });
      continue;
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        clientProfile: true,
      },
    });

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

    if (input.dryRun) {
      results.push({
        leadId: lead.id,
        email: normalizedEmail,
        outcome: "promoted",
        details: existingUser
          ? "Would attach a Client profile to the existing user and mark the lead as converted."
          : "Would create a User, create a Client profile, and mark the lead as converted.",
      });
      continue;
    }

    await prisma.$transaction(async (tx) => {
      const user =
        existingUser ??
        (await tx.user.create({
          data: {
            email: normalizedEmail,
            name: lead.fullName,
            password: lead.passwordHash,
            role: UserRole.CLIENT,
          },
        }));

      if (!existingUser) {
        // New users are already created with the right role and password.
      } else {
        await tx.user.update({
          where: { id: user.id },
          data: {
            name: user.name ?? lead.fullName,
            password: user.password ?? lead.passwordHash,
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
        ? "Attached or confirmed a Client profile on the existing user and marked the lead as converted."
        : "Created a new User and Client profile and marked the lead as converted.",
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
