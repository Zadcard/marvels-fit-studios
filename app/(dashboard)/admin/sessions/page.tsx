import { AdminSessionsWorkspace } from "@/components/dashboard/admin-sessions-workspace";
import { adminSessionRepository } from "@/lib/repositories/admin-session-repository";

export const metadata = {
  title: "Sessions Management",
};

export default async function AdminSessionsPage() {
  const { groupRecords, privateRecords } = await adminSessionRepository.list();

  return (
    <AdminSessionsWorkspace
      groupRecords={groupRecords}
      privateRecords={privateRecords}
    />
  );
}
