import { MarvelOpsScheduleWorkspace } from "@/components/dashboard/marvel-ops-schedule-workspace";
import type { MarvelOpsScheduleSession } from "@/components/dashboard/marvel-ops-schedule-workspace";
import { adminScheduleRepository } from "@/lib/repositories/admin-schedule-repository";

export const metadata = { title: "Schedule" };

const days = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const tones = ["red", "green", "violet", "blue", "amber", "teal"] as const;

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

export default async function AdminSchedulePage() {
  const { records } = await adminScheduleRepository.getSchedule();
  const sessions: MarvelOpsScheduleSession[] = records.flatMap((record, index) => {
    const day = days.indexOf(record.dayKey);
    if (day < 0) return [];
    return [{
      id: record.id,
      day,
      time: record.timeRange.split(" - ")[0] ?? record.timeRange,
      title: record.title,
      coach: record.coachName,
      coachInitials: initials(record.coachName),
      tone: tones[index % tones.length],
      capacity: record.occupancyLabel,
      location: record.location,
      note: record.focus,
      flags: record.injuryAlertCount ? `${record.injuryAlertCount} injury flag${record.injuryAlertCount === 1 ? "" : "s"}` : record.trialCount ? `${record.trialCount} trial` : undefined,
    }];
  });
  return <MarvelOpsScheduleWorkspace sessions={sessions} requests={[]} />;
}
