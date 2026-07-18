import { AdminAttendanceWorkspace } from "@/components/dashboard/admin-attendance-workspace";
import { adminAttendanceRepository } from "@/lib/repositories/admin-attendance-repository";

export const metadata = {
  title: "Attendance",
};

export default async function AdminAttendancePage() {
  const liveSessions = await adminAttendanceRepository.getToday();

  return (
    <AdminAttendanceWorkspace
      sessions={liveSessions}
      dataSource="live"
    />
  );
}
