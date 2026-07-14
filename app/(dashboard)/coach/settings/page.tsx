import { UserRole } from "@/lib/supabase/domain";

import { CoachSettingsWorkspace } from "@/components/dashboard/coach-settings-workspace";
import { requireRole } from "@/lib/auth/session";
import { coachSettingsRepository } from "@/lib/repositories/coach-settings-repository";

export const metadata = {
  title: "Coach Settings",
};

export default async function CoachSettingsPage() {
  const coachUser = await requireRole(UserRole.COACH);
  const settings = await coachSettingsRepository.getByUserId(coachUser.id);

  return <CoachSettingsWorkspace initialSettings={settings} />;
}
