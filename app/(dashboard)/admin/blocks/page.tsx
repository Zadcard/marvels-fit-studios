import { redirect } from "next/navigation";

export const metadata = {
  title: "Redirecting to Schedule",
};

export default async function AdminBlocksPage() {
  redirect("/admin/schedule");
}
