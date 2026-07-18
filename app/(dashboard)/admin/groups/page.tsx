import { MarvelOpsGroupsWorkspace } from "@/components/dashboard/marvel-ops-groups-workspace";
import { adminGroupRepository } from "@/lib/repositories/admin-group-repository";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = { title: "Groups" };

const tones = ["red", "green", "violet", "blue", "amber"] as const;

export default async function AdminGroupsPage() {
  const { records } = await adminGroupRepository.list();
  const { data: sessions } = await getSupabaseServerClient()
    .from("TrainingSession")
    .select("id,groupId")
    .eq("status", "SCHEDULED")
    .gte("startsAt", new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
    .order("startsAt");
  const attendanceByGroup = new Map((sessions ?? []).flatMap((session) => session.groupId ? [[session.groupId, session.id] as const] : []));

  return <MarvelOpsGroupsWorkspace groups={records.map((record, index) => ({ ...record, tone: tones[index % tones.length], attendanceSessionId: attendanceByGroup.get(record.id) ?? null }))} />;
}
