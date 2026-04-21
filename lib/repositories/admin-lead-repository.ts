import "server-only";

import { LeadStatus } from "@prisma/client";

import { readLeadCredentialClientId } from "@/lib/leads/lead-credential-metadata";
import type { AdminLeadRecord, AdminLeadStatus } from "@/lib/dashboard/admin-dashboard-data";
import { getPrisma } from "@/lib/prisma";

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

export class AdminLeadRepository {
  private prisma = getPrisma();

  async list(): Promise<AdminLeadRecord[]> {
    const leads = await this.prisma.lead.findMany({
      orderBy: [{ createdAt: "desc" }],
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
    });

    return leads.map((lead) => ({
      id: lead.id,
      fullName: lead.fullName,
      email: lead.email ?? "No email",
      phone: lead.phone,
      source: lead.source,
      status: toLeadStatus(lead.status),
      createdAt: formatDate(lead.createdAt),
      message: normalizeMessage(lead.message),
    }));
  }
}

export const adminLeadRepository = new AdminLeadRepository();
