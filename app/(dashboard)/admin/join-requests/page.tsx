import { MarvelOpsAdminView } from "@/components/dashboard/marvel-ops-admin-view";
import type { MarvelOpsLead } from "@/components/dashboard/marvel-ops-admin-view";
import { adminGroupRepository } from "@/lib/repositories/admin-group-repository";
import { adminLeadRepository } from "@/lib/repositories/admin-lead-repository";
import { normalizeLeadSource } from "@/lib/dashboard/lead-source";

export const metadata = { title: "Leads & Trials" };

const tones = ["red", "green", "violet", "blue", "amber"];

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function stageFor(status: string): MarvelOpsLead["stage"] {
  if (status === "CONVERTED" || status === "Converted") return "Won";
  if (status === "CLOSED" || status === "Closed") return "Lost";
  if (status === "CONTACTED" || status === "Contacted") return "Trial booked";
  if (status === "TRIAL_DONE" || status === "Trial done") return "Trial done";
  return "New";
}

export default async function AdminJoinRequestsPage() {
  const [{ records }, { records: groups }] = await Promise.all([
    adminLeadRepository.list(),
    adminGroupRepository.list(),
  ]);
  const initialLeads: MarvelOpsLead[] = records.map((record, index) => ({
    id: record.id,
    stage: stageFor(record.status),
    name: record.fullName,
    initials: initials(record.fullName),
    tone: tones[index % tones.length],
    source: normalizeLeadSource(record.source),
    phone: record.phone,
    wants: "Trial consultation",
    note: record.message,
    assigned: record.trialGroupId ? `Trial: ${groups.find((group) => group.id === record.trialGroupId)?.name ?? "Assigned group"}` : undefined,
  }));

  return <MarvelOpsAdminView view="leads" initialLeads={initialLeads} trialGroups={groups.filter((group) => group.isActive).map((group) => ({ id: group.id, name: group.name }))} />;
}
