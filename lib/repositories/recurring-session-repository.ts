import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { RecurringSessionTemplateRecord } from "@/lib/dashboard/recurring-session-template";

export class RecurringSessionRepository {
  async list() {
    const supabase = getSupabaseServerClient();
    const [templates, coaches, groups] = await Promise.all([
      supabase
        .from("RecurringSessionTemplate")
        .select(
          "*, coach:Coach(fullName), group:Group(name), slots:RecurringSessionSlot(weekday, localStartTime)",
        )
        .order("createdAt", { ascending: false }),
      supabase.from("Coach").select("id, fullName").order("fullName"),
      supabase.from("Group").select("id, name").order("name"),
    ]);
    if (templates.error) throw templates.error;
    if (coaches.error) throw coaches.error;
    if (groups.error) throw groups.error;
    const records: RecurringSessionTemplateRecord[] = templates.data.map(
      (template) => ({
        id: template.id,
        title: template.title,
        description: template.description ?? "",
        type: template.type,
        coachId: template.coachId,
        coachName: template.coach.fullName,
        groupId: template.groupId,
        groupName: template.group?.name ?? "No linked group",
        slots: template.slots
          .map((slot) => ({
            weekday: slot.weekday,
            localStartTime: slot.localStartTime.slice(0, 5),
          }))
          .sort((left, right) => left.weekday - right.weekday),
        durationMinutes: template.durationMinutes,
        startsOn: template.startsOn,
        endsOn: template.endsOn ?? "",
        active: template.active,
        lastGeneratedThrough: template.lastGeneratedThrough,
      }),
    );
    return { templates: records, coaches: coaches.data, groups: groups.data };
  }
}

export const recurringSessionRepository = new RecurringSessionRepository();
