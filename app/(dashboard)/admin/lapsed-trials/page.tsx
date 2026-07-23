import { redirect } from "next/navigation";

export default function AdminLapsedTrialsPage() {
  redirect("/admin/clients?segment=lapsed-trials");
}
