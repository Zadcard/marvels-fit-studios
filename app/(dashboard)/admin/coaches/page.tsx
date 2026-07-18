import { AdminCoachesCommandCenter } from "@/components/dashboard/admin-coaches-command-center";
import { adminCoachRepository } from "@/lib/repositories/admin-coach-repository";

export const metadata = { title: "Coaches" };

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminCoachesPage(
  props: PageProps<"/admin/coaches">,
) {
  const searchParams = await props.searchParams;
  const initialSearch = getSingleValue(searchParams.q)?.trim() ?? "";
  const records = await adminCoachRepository.list();

  return (
    <AdminCoachesCommandCenter
      records={records}
      initialSearch={initialSearch}
    />
  );
}
