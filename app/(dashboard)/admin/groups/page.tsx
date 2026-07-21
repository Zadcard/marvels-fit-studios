import { redirect } from "next/navigation";

export const metadata = { title: "Groups" };

export default async function AdminGroupsPage() {
  redirect("/admin/categories");
}
