import { AdminClientsWorkspace } from "@/components/dashboard/admin-clients-workspace";
import { adminClientRepository } from "@/lib/repositories/admin-client-repository";
import { adminGroupRepository } from "@/lib/repositories/admin-group-repository";
import { adminTrainingCategoryRepository } from "@/lib/repositories/admin-training-category-repository";

export const metadata = { title: "Clients" };

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminClientsPage(
  props: PageProps<"/admin/clients">,
) {
  const searchParams = await props.searchParams;
  const search = getSingleValue(searchParams.q)?.trim() ?? "";
  const initial =
    getSingleValue(searchParams.initial)?.trim().slice(0, 1).toUpperCase() ?? "";
  const sort = getSingleValue(searchParams.sort) === "desc" ? "desc" : "asc";
  const page = Math.max(
    1,
    Number(getSingleValue(searchParams.page) ?? "1") || 1,
  );
  const [clientDirectory, groupData, categoryOptions] = await Promise.all([
    adminClientRepository.list({ search, initial: initial || null, sort }),
    adminGroupRepository.list(),
    adminTrainingCategoryRepository.options({ activeOnly: true }),
  ]);
  const activeCategoryIds = new Set(categoryOptions.map((category) => category.id));
  const groupOptions = groupData.records
    .filter((group) => group.isActive && activeCategoryIds.has(group.categoryId))
    .map((group) => ({ id: group.id, name: group.name, categoryId: group.categoryId }));

  return (
    <AdminClientsWorkspace
      records={clientDirectory.records}
      searchValue={search}
      selectedInitial={initial || null}
      sortOrder={sort}
      currentPage={page}
      totalCount={clientDirectory.totalCount}
      filteredCount={clientDirectory.filteredCount}
      initialOptions={clientDirectory.initialOptions}
      groupOptions={groupOptions}
      categoryOptions={categoryOptions}
    />
  );
}
