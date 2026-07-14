import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";

export class RecurringSessionRepository {
  async list() {
    const supabase = getSupabaseServerClient();
    const [templates, coaches, groups] = await Promise.all([
      supabase
        .from("RecurringSessionTemplate")
        .select("*, coach:Coach(fullName), group:Group(name)")
        .order("createdAt", { ascending: false }),
      supabase.from("Coach").select("id, fullName").order("fullName"),
      supabase.from("Group").select("id, name").order("name"),
    ]);
    if (templates.error) throw templates.error;
    if (coaches.error) throw coaches.error;
    if (groups.error) throw groups.error;
    return { templates: templates.data, coaches: coaches.data, groups: groups.data };
  }
}

export const recurringSessionRepository = new RecurringSessionRepository();
