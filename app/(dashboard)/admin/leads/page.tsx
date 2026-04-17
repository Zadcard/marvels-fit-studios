import { redirect } from "next/navigation";

export const metadata = {
  title: "Redirecting to Join Requests",
};

export default async function AdminLeadsPage() {
  redirect("/admin/join-requests");
}
