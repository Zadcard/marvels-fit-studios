import type { TrainingCategoryLabel } from "@/lib/dashboard/client-domain-labels";
import type { RecurringSessionTemplateSlot } from "@/lib/dashboard/recurring-session-template";

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
  trainingCategory: TrainingCategoryLabel;
  coachId: string;
  coachName: string;
  capacity: number | null;
  isActive: boolean;
  notes: string;
  memberCount: number;
  members: AdminGroupMember[];
  scheduleSummary: string;
  capacityLabel: string;
  series: AdminGroupSeries | null;
};

export type AdminGroupCoachOption = {
  id: string;
  fullName: string;
};

export type AdminGroupClientOption = {
  id: string;
  fullName: string;
  groupId: string | null;
};
