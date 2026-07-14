import { RecurringSessionWorkspace } from "@/components/dashboard/recurring-session-workspace";
import { recurringSessionRepository } from "@/lib/repositories/recurring-session-repository";

export const metadata = { title: "Recurring Sessions" };

export default async function RecurringSessionsPage() {
  const data = await recurringSessionRepository.list();
  return <RecurringSessionWorkspace {...data} />;
}
