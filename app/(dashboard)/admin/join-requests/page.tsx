import { AdminLeadsWorkspace } from "@/components/dashboard/admin-leads-workspace";
import { adminLeadRepository } from "@/lib/repositories/admin-lead-repository";

export const metadata = {
  title: "Join Requests",
};

function getSingleValue(
  value: string | string[] | undefined
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminJoinRequestsPage(
  props: PageProps<"/admin/join-requests">
) {
  const searchParams = await props.searchParams;
  const search = getSingleValue(searchParams.q)?.trim() ?? "";
  const initial =
    getSingleValue(searchParams.initial)?.trim().slice(0, 1).toUpperCase() ?? "";
  const sort = getSingleValue(searchParams.sort) === "desc" ? "desc" : "asc";
  const page = Math.max(1, Number(getSingleValue(searchParams.page) ?? "1") || 1);
  const leadDirectory = await adminLeadRepository.list({
    search,
    initial: initial || null,
    sort,
  });

  return (
    <AdminLeadsWorkspace
      records={leadDirectory.records}
      searchValue={search}
      selectedInitial={initial || null}
      sortOrder={sort}
      currentPage={page}
      totalCount={leadDirectory.totalCount}
      filteredCount={leadDirectory.filteredCount}
      initialOptions={leadDirectory.initialOptions}
    />
  );
}
