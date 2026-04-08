import { AdminProfileWorkspace } from "@/components/dashboard/admin-profile-workspace";
import { auth } from "@/auth";
import { adminProfileRepository } from "@/lib/repositories/admin-profile-repository";

export const metadata = {
  title: "Admin Profile",
};

export default async function AdminProfilePage() {
  const session = await auth();

  const data = session?.user?.id
    ? await adminProfileRepository.getByUserId(session.user.id)
    : null;

  return (
    <AdminProfileWorkspace
      profile={data?.profile}
      metrics={data?.metrics}
      preferences={data?.preferences}
    />
  );
}
