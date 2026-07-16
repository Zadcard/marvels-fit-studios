import { AdminGroupsWorkspace } from "@/components/dashboard/admin-groups-workspace";
import { adminGroupRepository } from "@/lib/repositories/admin-group-repository";

export const metadata = {
  title: "Groups",
};

export default async function AdminGroupsPage() {
  const { records, coachOptions, clientOptions } =
    await adminGroupRepository.list();

  return (
    <AdminGroupsWorkspace
      records={records}
      coachOptions={coachOptions}
      clientOptions={clientOptions}
    />
  );
}
