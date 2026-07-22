import { AdminLapsedTrialsWorkspace } from "@/components/dashboard/admin-lapsed-trials-workspace";
import { adminGroupRepository } from "@/lib/repositories/admin-group-repository";
import { adminLeadRepository } from "@/lib/repositories/admin-lead-repository";

export const metadata = { title: "Lapsed Trials" };

export default async function AdminLapsedTrialsPage() {
  const [{ records, totalCount }, groupData] = await Promise.all([
    adminLeadRepository.listLapsedTrials(),
    adminGroupRepository.list(),
  ]);

  const trialGroups = groupData.records
    .filter((group) => group.isActive)
    .map((group) => ({ id: group.id, name: group.name, categoryId: group.categoryId }));

  return (
    <AdminLapsedTrialsWorkspace
      records={records}
      totalCount={totalCount}
      trialGroups={trialGroups}
    />
  );
}
