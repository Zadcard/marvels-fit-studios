import "server-only";

import type {
  AdminGroupClientOption,
  AdminGroupCoachOption,
  AdminGroupRecord,
} from "@/lib/dashboard/admin-group-record";
import { trainingCategoryLabelFor } from "@/lib/dashboard/client-domain-labels";
import { withSupabaseFallback } from "@/lib/supabase/errors";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatLocalTime(value: string) {
  // localStartTime is a Postgres `time` string like "18:30:00".
  const [hoursRaw, minutesRaw] = value.split(":");
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return value;
  }
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  const displayMinutes = minutes.toString().padStart(2, "0");
  return `${displayHour}:${displayMinutes} ${suffix}`;
}

function buildScheduleSummary(
  templates: Array<{ weekday: number; localStartTime: string; active: boolean }>,
): string {
  const active = templates
    .filter((template) => template.active)
    .sort((left, right) => left.weekday - right.weekday);

  if (!active.length) {
    return "Sessions to be determined";
  }

  return active
    .map(
      (template) =>
        `${WEEKDAY_LABELS[template.weekday] ?? "?"} ${formatLocalTime(template.localStartTime)}`,
    )
    .join(" · ");
}

export class AdminGroupRepository {
  async list(): Promise<{
    records: AdminGroupRecord[];
    coachOptions: AdminGroupCoachOption[];
    clientOptions: AdminGroupClientOption[];
  }> {
    const supabase = getSupabaseServerClient();

    const [records, coachOptions, clientOptions] = await Promise.all([
      withSupabaseFallback<AdminGroupRecord[]>(async () => {
        const { data, error } = await supabase
          .from("Group")
          .select(
            "id,name,type,trainingCategory,capacity,isActive,notes,createdAt,coach:Coach(id,fullName),members:Client(id,fullName),templates:RecurringSessionTemplate(weekday,localStartTime,active)",
          )
          .order("name");
        if (error) throw error;

        return data.map((group) => {
          const members = group.members
            .map((member) => ({ id: member.id, fullName: member.fullName }))
            .sort((left, right) => left.fullName.localeCompare(right.fullName));

          return {
            id: group.id,
            name: group.name,
            groupType: group.type === "PRIVATE" ? "Private" : "Group",
            trainingCategory: trainingCategoryLabelFor(group.trainingCategory),
            coachId: group.coach?.id ?? "",
            coachName: group.coach?.fullName ?? "Unassigned",
            capacity: group.capacity,
            isActive: group.isActive,
            notes: group.notes?.trim() ?? "",
            memberCount: members.length,
            members,
            scheduleSummary: buildScheduleSummary(group.templates),
            capacityLabel:
              group.capacity != null
                ? `${members.length} / ${group.capacity}`
                : `${members.length}`,
          } satisfies AdminGroupRecord;
        });
      }, []),
      withSupabaseFallback<AdminGroupCoachOption[]>(async () => {
        const { data, error } = await supabase
          .from("Coach")
          .select("id,fullName")
          .order("fullName");
        if (error) throw error;
        return data;
      }, []),
      withSupabaseFallback<AdminGroupClientOption[]>(async () => {
        const { data, error } = await supabase
          .from("Client")
          .select("id,fullName,groupId")
          .order("fullName");
        if (error) throw error;
        return data;
      }, []),
    ]);

    return { records, coachOptions, clientOptions };
  }
}

export const adminGroupRepository = new AdminGroupRepository();
