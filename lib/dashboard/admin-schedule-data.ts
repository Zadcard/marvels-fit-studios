import type { DashboardStatIconKey } from "@/lib/dashboard/workspace-definition";

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
  sessionType: AdminScheduleSessionType;
  status: AdminScheduleSessionStatus;
  groupName: string;
  dayKey: string;
  dayLabel: string;
  dateLabel: string;
  timeRange: string;
  coachId: string;
  coachName: string;
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
