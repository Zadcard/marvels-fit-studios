import { redirect } from "next/navigation";

export default function AdminInactiveLeadsPage() {
  redirect("/admin/clients?segment=inactive");
}
