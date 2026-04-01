export type CoachScheduleStatus = "Ready" | "Prep" | "Completed";
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

export const coachScheduleDayFilters = [
  "All days",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const coachScheduleStatusFilters: Array<"All" | CoachScheduleStatus> = [
  "All",
  "Ready",
  "Prep",
  "Completed",
];

export const coachScheduleRecords: CoachScheduleRecord[] = [
  {
    id: "coach-schedule-mon-1",
    dayKey: "Monday",
    dayLabel: "Monday",
    dateLabel: "Apr 6",
    title: "Strength Foundations",
    timeRange: "6:30 PM - 7:30 PM",
    sessionType: "Group",
    status: "Ready",
    location: "Performance Floor A",
    rosterLabel: "14 / 18 booked",
    note: "Prime-time class with two newer members needing extra pacing attention.",
  },
  {
    id: "coach-schedule-mon-2",
    dayKey: "Monday",
    dayLabel: "Monday",
    dateLabel: "Apr 6",
    title: "Private Progress Check",
    timeRange: "8:00 PM - 8:45 PM",
    sessionType: "Private",
    status: "Prep",
    location: "Private Studio 2",
    rosterLabel: "Sara Nabil",
    note: "Review last week's note before session start.",
  },
  {
    id: "coach-schedule-tue-1",
    dayKey: "Tuesday",
    dayLabel: "Tuesday",
    dateLabel: "Apr 7",
    title: "Conditioning Lab Support",
    timeRange: "5:00 PM - 6:00 PM",
    sessionType: "Group",
    status: "Ready",
    location: "Performance Floor B",
    rosterLabel: "Overflow assist",
    note: "Assist with overflow pacing if the waitlist converts.",
  },
  {
    id: "coach-schedule-thu-1",
    dayKey: "Thursday",
    dayLabel: "Thursday",
    dateLabel: "Apr 9",
    title: "Hybrid Athlete Lab",
    timeRange: "7:00 PM - 8:00 PM",
    sessionType: "Group",
    status: "Ready",
    location: "Floor A",
    rosterLabel: "16 / 18 booked",
    note: "Expect stronger intermediate attendance and faster station changes.",
  },
  {
    id: "coach-schedule-fri-1",
    dayKey: "Friday",
    dayLabel: "Friday",
    dateLabel: "Apr 10",
    title: "Movement Reset",
    timeRange: "5:30 PM - 6:15 PM",
    sessionType: "Private",
    status: "Completed",
    location: "Private Studio 1",
    rosterLabel: "Mona Adel",
    note: "Follow-up message still needed before end of the day.",
  },
];
