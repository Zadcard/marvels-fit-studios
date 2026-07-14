import { AdminProfileWorkspace } from "@/components/dashboard/admin-profile-workspace";
import { requireRole } from "@/lib/auth/session";
import { adminProfileRepository } from "@/lib/repositories/admin-profile-repository";

export const metadata = {
  title: "Admin Profile",
};

export default async function AdminProfilePage() {
  const adminUser = await requireRole("ADMIN");
  const data = await adminProfileRepository.getByUserId(adminUser.id);

  return (
    <AdminProfileWorkspace
      profile={data?.profile}
      metrics={data?.metrics}
    />
  );
}
