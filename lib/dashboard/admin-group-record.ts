import type { RecurringSessionTemplateSlot } from "@/lib/dashboard/recurring-session-template";
import type { TrainingCategoryOption } from "@/lib/dashboard/training-category";

export type AdminGroupType = "Group" | "Private";

export type AdminGroupMember = {
  id: string;
  fullName: string;
};

export type AdminGroupSeries = {
  templateId: string;
  durationMinutes: number;
  startsOn: string;
  endsOn: string;
  slots: RecurringSessionTemplateSlot[];
};

export type AdminGroupRecord = {
  id: string;
  name: string;
  groupType: AdminGroupType;
  categoryId: string;
  categoryName: string;
  coachId: string;
  coachName: string;
  isActive: boolean;
  notes: string;
  memberCount: number;
  members: AdminGroupMember[];
  scheduleSummary: string;
  series: AdminGroupSeries | null;
};

export type AdminGroupCoachOption = {
  id: string;
  fullName: string;
  qualifiedCategoryIds: string[];
};

export type AdminGroupCategoryOption = TrainingCategoryOption;

export type AdminGroupClientOption = {
  id: string;
  fullName: string;
  groupId: string | null;
};
