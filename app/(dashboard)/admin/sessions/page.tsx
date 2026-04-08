import { AdminSessionsWorkspace } from "@/components/dashboard/admin-sessions-workspace";
import { adminSessionRepository } from "@/lib/repositories/admin-session-repository";

export const metadata = {
  title: "Sessions Management",
};

export default async function AdminSessionsPage() {
  const {
    groupRecords,
    privateRecords,
    editorRecords,
    coachOptions,
    clientOptions,
  } =
    await adminSessionRepository.list();

  return (
    <AdminSessionsWorkspace
      groupRecords={groupRecords}
      privateRecords={privateRecords}
      editorRecords={editorRecords}
      coachOptions={coachOptions}
      clientOptions={clientOptions}
    />
  );
}
