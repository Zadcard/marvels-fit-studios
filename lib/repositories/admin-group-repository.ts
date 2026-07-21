import "server-only";

import type {
  AdminGroupClientOption,
  AdminGroupCategoryOption,
  AdminGroupCoachOption,
  AdminGroupRecord,
  AdminGroupSeries,
} from "@/lib/dashboard/admin-group-record";
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
  templates: Array<{
    active: boolean;
    slots: Array<{ weekday: number; localStartTime: string }>;
  }>,
): string {
  const activeSlots = templates
    .filter((template) => template.active)
    .flatMap((template) => template.slots)
    .sort((left, right) => left.weekday - right.weekday);

  if (!activeSlots.length) {
    return "Sessions to be determined";
  }

  return activeSlots
    .map((slot) => `${WEEKDAY_LABELS[slot.weekday] ?? "?"} ${formatLocalTime(slot.localStartTime)}`)
    .join(" · ");
}

function pickPrimarySeries(
  templates: Array<{
    id: string;
    createdAt: string;
    durationMinutes: number;
    startsOn: string;
    endsOn: string | null;
    slots: Array<{ weekday: number; localStartTime: string }>;
  }>,
): AdminGroupSeries | null {
  if (!templates.length) return null;
  const [primary] = [...templates].sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );
  return {
    templateId: primary.id,
    durationMinutes: primary.durationMinutes,
    startsOn: primary.startsOn,
    endsOn: primary.endsOn ?? "",
    slots: primary.slots
      .map((slot) => ({ weekday: slot.weekday, localStartTime: slot.localStartTime.slice(0, 5) }))
      .sort((left, right) => left.weekday - right.weekday),
  };
}

export class AdminGroupRepository {
  async list({ categoryIds }: { categoryIds?: readonly string[] } = {}): Promise<{
    records: AdminGroupRecord[];
    coachOptions: AdminGroupCoachOption[];
    clientOptions: AdminGroupClientOption[];
    categoryOptions: AdminGroupCategoryOption[];
  }> {
    if (categoryIds && categoryIds.length === 0) {
      return { records: [], coachOptions: [], clientOptions: [], categoryOptions: [] };
    }
    const supabase = getSupabaseServerClient();

    const [records, coachOptions, clientOptions, categoryOptions] = await Promise.all([
      withSupabaseFallback<AdminGroupRecord[]>(async () => {
        let query = supabase
          .from("Group")
          .select(
            "id,name,type,categoryId,category:TrainingCategory(name),isActive,notes,createdAt,coach:Coach(id,fullName),members:Client(id,fullName),templates:RecurringSessionTemplate(id,createdAt,active,durationMinutes,startsOn,endsOn,slots:RecurringSessionSlot(weekday,localStartTime))",
          );
        if (categoryIds) query = query.in("categoryId", [...categoryIds]);
        const { data, error } = await query.order("name");
        if (error) throw error;

        return data.map((group) => {
          const members = group.members
            .map((member) => ({ id: member.id, fullName: member.fullName }))
            .sort((left, right) => left.fullName.localeCompare(right.fullName));

          return {
            id: group.id,
            name: group.name,
            groupType: group.type === "PRIVATE" ? "Private" : "Group",
            categoryId: group.categoryId,
            categoryName: group.category?.name ?? "Unknown category",
            coachId: group.coach?.id ?? "",
            coachName: group.coach?.fullName ?? "Unassigned",
            isActive: group.isActive,
            notes: group.notes?.trim() ?? "",
            memberCount: members.length,
            members,
            scheduleSummary: buildScheduleSummary(group.templates),
            series: pickPrimarySeries(group.templates),
          } satisfies AdminGroupRecord;
        });
      }, []),
      withSupabaseFallback<AdminGroupCoachOption[]>(async () => {
        const { data, error } = await supabase
          .from("Coach")
          .select("id,fullName,qualifications:CoachTrainingCategory(categoryId)")
          .order("fullName");
        if (error) throw error;
        return data.map((coach) => ({
          id: coach.id,
          fullName: coach.fullName,
          qualifiedCategoryIds: coach.qualifications.map((item) => item.categoryId),
        }));
      }, []),
      withSupabaseFallback<AdminGroupClientOption[]>(async () => {
        const { data, error } = await supabase
          .from("Client")
          .select("id,fullName,groupId,group:Group(categoryId)")
          .order("fullName");
        if (error) throw error;
        return data
          .filter((client) => !categoryIds || !client.groupId || categoryIds.includes(client.group?.categoryId ?? ""))
          .map((client) => ({ id: client.id, fullName: client.fullName, groupId: client.groupId }));
      }, []),
      withSupabaseFallback<AdminGroupCategoryOption[]>(async () => {
        let query = supabase
          .from("TrainingCategory")
          .select("id,name,slug,isActive");
        if (categoryIds) query = query.in("id", [...categoryIds]);
        const { data, error } = await query.order("name");
        if (error) throw error;
        return data;
      }, []),
    ]);

    return { records, coachOptions, clientOptions, categoryOptions };
  }
}

export const adminGroupRepository = new AdminGroupRepository();
