import { CoachSettingsWorkspace } from "@/components/dashboard/coach-settings-workspace";
import { requireRole } from "@/lib/auth/session";
import { coachSettingsRepository } from "@/lib/repositories/coach-settings-repository";
import { UserRole } from "@/lib/supabase/domain";

export const metadata = { title: "Coach settings" };

export default async function CoachSettingsPage() {
  const coach = await requireRole(UserRole.COACH);
  const settings = await coachSettingsRepository.getByUserId(coach.id);
  if (!settings) {
    return <p>Coach profile is unavailable. Ask an administrator to restore the profile link.</p>;
  }
  return <CoachSettingsWorkspace settings={settings} />;
}
