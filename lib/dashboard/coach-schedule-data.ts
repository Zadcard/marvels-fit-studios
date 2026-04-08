export type CoachScheduleStatus = "Ready" | "Prep" | "Completed" | "Waitlist";
export type CoachScheduleSessionType = "Group" | "Private";

export type CoachScheduleRecord = {
  id: string;
  dayKey: string;
  dayLabel: string;
  dateLabel: string;
  title: string;
  timeRange: string;
  sessionType: CoachScheduleSessionType;
  status: CoachScheduleStatus;
  location: string;
  rosterLabel: string;
  note: string;
};

export const coachScheduleStatusFilters: Array<"All" | CoachScheduleStatus> = [
  "All",
  "Ready",
  "Prep",
  "Completed",
  "Waitlist",
];
