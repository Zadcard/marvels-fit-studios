import { redirect } from "next/navigation";

export const metadata = {
  title: "Redirecting to Clients",
};

export default async function AdminSubscriptionsPage() {
  redirect("/admin/clients");
}
