import { AdminAttendanceWorkspace } from "@/components/dashboard/admin-attendance-workspace";
import { adminAttendanceRepository } from "@/lib/repositories/admin-attendance-repository";

export const metadata = {
  title: "Attendance",
};

function singleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminAttendancePage(
  props: PageProps<"/admin/attendance">,
) {
  const searchParams = await props.searchParams;
  const sessionId = singleValue(searchParams?.session);
  const dateKey = singleValue(searchParams?.date);
  const liveSessions = await adminAttendanceRepository.getForDate(dateKey);

  return (
    <AdminAttendanceWorkspace
      sessions={liveSessions}
      dataSource="live"
      initialSessionId={sessionId}
      initialDateKey={dateKey}
    />
  );
}
