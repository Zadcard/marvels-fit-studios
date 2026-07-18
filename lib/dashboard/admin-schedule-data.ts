import type { DashboardStatIconKey } from "@/lib/dashboard/workspace-definition";
import type { TrainingCategoryLabel } from "@/lib/dashboard/client-domain-labels";

export type AdminScheduleSessionType = "Group" | "Private";
export type AdminScheduleSessionStatus =
  | "Confirmed"
  | "Waitlist"
  | "Attention"
  | "Completed";

export type AdminScheduleStat = {
  id: string;
  label: string;
  value: string;
  change: string;
  detail: string;
  note: string;
  icon: DashboardStatIconKey;
  tone: "accent" | "success" | "warning" | "neutral";
};

export type AdminScheduleSessionRecord = {
  id: string;
  title: string;
  rawStatus: "DRAFT" | "SCHEDULED" | "COMPLETED" | "CANCELED";
  sessionType: AdminScheduleSessionType;
  status: AdminScheduleSessionStatus;
  groupName: string;
  dayKey: string;
  dayLabel: string;
  dateLabel: string;
  timeRange: string;
  coachId: string;
  groupId: string | null;
  coachName: string;
  trainingCategory: TrainingCategoryLabel | null;
  injuryAlertCount: number;
  trialCount: number;
  location: string;
  occupancyLabel: string;
  rosterCount: number;
  bookedCount: number;
  waitlistCount: number;
  attendanceNote: string;
  focus: string;
  highlight: string;
  startsAt: string;
  endsAt: string;
  capacity: number | null;
  sourceTemplateId: string | null;
  bookedClients: Array<{
    id: string;
    fullName: string;
    status: "BOOKED" | "ATTENDED" | "MISSED" | "WAITLIST";
  }>;
  recentChanges: Array<{ id: string; label: string; dateLabel: string }>;
};

export const adminScheduleDayFilters = [
  "All days",
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const adminScheduleStatusFilters: Array<
  "All statuses" | AdminScheduleSessionStatus
> = ["All statuses", "Confirmed", "Waitlist", "Attention", "Completed"];

export const adminScheduleSessionTypeFilters: Array<
  "All types" | AdminScheduleSessionType
> = ["All types", "Group", "Private"];
