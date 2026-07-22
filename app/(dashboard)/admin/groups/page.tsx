import { redirect } from "next/navigation";

export const metadata = { title: "Programs" };

export default async function AdminGroupsPage() {
  redirect("/admin/categories");
}
