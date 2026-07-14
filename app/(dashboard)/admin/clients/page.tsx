import { AdminClientsWorkspace } from "@/components/dashboard/admin-clients-workspace";
import { adminClientRepository } from "@/lib/repositories/admin-client-repository";
import { getSupabaseServerClient } from "@/lib/supabase/server";

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
  const page = Math.max(1, Number(getSingleValue(searchParams.page) ?? "1") || 1);
  const clientDirectory = await adminClientRepository.list({
    search,
    initial: initial || null,
    sort,
  });
  const { data: groupOptions, error } = await getSupabaseServerClient()
    .from("Group")
    .select("id,name")
    .order("name");
  if (error) throw error;

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
      groupOptions={groupOptions ?? []}
    />
  );
}
