import { MarvelOpsAdminView } from "@/components/dashboard/marvel-ops-admin-view";
import type { MarvelOpsClientPerson } from "@/components/dashboard/marvel-ops-admin-view";
import { adminClientRepository } from "@/lib/repositories/admin-client-repository";

export const metadata = { title: "Clients" };

const tones = ["red", "violet", "teal", "green", "amber", "blue"];

function initials(fullName: string) {
  return fullName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default async function AdminClientsPage() {
  const { records } = await adminClientRepository.list();
  const initialPeople: MarvelOpsClientPerson[] = records.map((record, index) => ({
    name: record.fullName,
    initials: initials(record.fullName),
    category: record.primaryGroup === "No group" ? record.trainingCategory : record.primaryGroup,
    type: record.membership === "Private Coaching" ? "Private" : "Group",
    phone: record.phone,
    coach: record.assignedCoach,
    coachInitials: initials(record.assignedCoach),
    status:
      record.status === "Active"
        ? "Active"
        : record.status === "Paused"
          ? "Paused"
          : record.status === "Trial"
            ? "Trial"
            : "Inactive",
    plan: record.membership,
    sessions: `${record.sessionsLeft} of ${record.sessionsTotal}`,
    injury: record.hasInjuryAlert ? record.injuryNotes : undefined,
    tone: tones[index % tones.length],
  }));

  return <MarvelOpsAdminView view="clients" initialPeople={initialPeople} />;
}
