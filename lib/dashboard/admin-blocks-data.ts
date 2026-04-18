import type { DashboardStatIconKey } from "@/components/dashboard/dashboard-stat-card";

export type AdminScheduleBlockStatus = "Active" | "Paused" | "Archived";

export type AdminScheduleBlockRecord = {
  id: string;
  title: string;
  description: string;
  sessionType: "Group" | "Private";
  status: AdminScheduleBlockStatus;
  recurrenceDays: string[];
  startsOn: string;
  endsOn: string;
  startTime: string;
  endTime: string;
  timezone: string;
  recurrenceSummary: string;
  activeDateRange: string;
  nextOccurrenceLabel: string;
  coachId: string;
  coachName: string;
  groupId: string | null;
  groupName: string;
  location: string;
  capacityLabel: string;
  rosterCount: number;
  sessionsThisWeek: number;
  totalUpcomingOccurrences: number;
  conflicts: string[];
  note: string;
  clientIds: string[];
  clients: Array<{
    id: string;
    fullName: string;
    nextSession: string;
  }>;
  upcomingOccurrences: Array<{
    id: string;
    dateLabel: string;
    timeLabel: string;
    occupancyLabel: string;
    status: string;
  }>;
};

export type AdminScheduleBlockStat = {
  id: string;
  label: string;
  value: string;
  change: string;
  detail: string;
  note: string;
  icon: DashboardStatIconKey;
  tone: "accent" | "success" | "warning" | "neutral";
};

export type AdminScheduleBlockCoachOption = {
  id: string;
  fullName: string;
  sessionsThisWeek: number;
  recurringBlocks: number;
  activeClients: number;
};

export type AdminScheduleBlockGroupOption = {
  id: string;
  name: string;
  type: "Group" | "Private";
  coachName: string;
  memberCount: number;
};

export type AdminScheduleBlockClientOption = {
  id: string;
  fullName: string;
  currentBlockId: string | null;
  currentBlockName: string;
  assignedCoach: string;
  nextSession: string;
};
