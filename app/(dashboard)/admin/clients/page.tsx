import { AdminClientsWorkspace } from "@/components/dashboard/admin-clients-workspace";
import { adminClientRepository } from "@/lib/repositories/admin-client-repository";
import { adminScheduleBlockRepository } from "@/lib/repositories/admin-schedule-block-repository";

export const metadata = {
  title: "Clients Management",
};

function getSingleValue(
  value: string | string[] | undefined
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminClientsPage(
  props: PageProps<"/admin/clients">
) {
  const searchParams = await props.searchParams;
  const search = getSingleValue(searchParams.q)?.trim() ?? "";
  const initial = getSingleValue(searchParams.initial)?.trim().slice(0, 1).toUpperCase() ?? "";
  const sort = getSingleValue(searchParams.sort) === "desc" ? "desc" : "asc";
  const clientDirectory = await adminClientRepository.list({
    search,
    initial: initial || null,
    sort,
  });
  const { blockRecords, groupOptions } = await adminScheduleBlockRepository.list();

  return (
    <AdminClientsWorkspace
      records={clientDirectory.records}
      searchValue={search}
      selectedInitial={initial || null}
      sortOrder={sort}
      totalCount={clientDirectory.totalCount}
      filteredCount={clientDirectory.filteredCount}
      initialOptions={clientDirectory.initialOptions}
      blockOptions={blockRecords.map((block) => ({
        id: block.id,
        title: block.title,
      }))}
      groupOptions={groupOptions}
    />
  );
}
