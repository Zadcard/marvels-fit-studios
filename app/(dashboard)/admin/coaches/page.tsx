import { MarvelOpsAdminView } from "@/components/dashboard/marvel-ops-admin-view";
import type { MarvelOpsCoach } from "@/components/dashboard/marvel-ops-admin-view";
import { adminCoachRepository } from "@/lib/repositories/admin-coach-repository";

export const metadata = { title: "Coaches" };

const tones = ["red", "green", "violet", "blue", "amber"];

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

export default async function AdminCoachesPage() {
  const records = await adminCoachRepository.list();
  const initialCoaches: MarvelOpsCoach[] = records.map((record, index) => ({
    name: record.fullName,
    initials: initials(record.fullName),
    role: record.specialization,
    free: `${record.openSlots} slots free`,
    today: record.summary,
    week: record.sessionsThisWeek,
    clients: record.activeClients,
    load: Math.min(100, Math.round(record.sessionsThisWeek / 12 * 100)),
    tone: tones[index % tones.length],
    busy: record.weeklyLoad.flatMap((entry, dayIndex) => entry.sessions > 0 ? [dayIndex] : []),
  }));

  return <MarvelOpsAdminView view="coaches" initialCoaches={initialCoaches} />;
}
