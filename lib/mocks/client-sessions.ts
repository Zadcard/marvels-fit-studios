export type ClientSessionStatus = "Booked" | "Check-in ready" | "Completed";
export type ClientSessionType = "Group" | "Private";
export type ClientSessionPeriod = "Upcoming" | "Past";

export type ClientSessionRecord = {
  id: string;
  title: string;
  sessionType: ClientSessionType;
  status: ClientSessionStatus;
  period: ClientSessionPeriod;
  dayLabel: string;
  timeLabel: string;
  location: string;
  coachName: string;
  note: string;
};

export const clientSessionPeriodFilters: Array<"All" | ClientSessionPeriod> = [
  "All",
  "Upcoming",
  "Past",
];

export const clientSessionTypeFilters: Array<"All" | ClientSessionType> = [
  "All",
  "Group",
  "Private",
];

export const clientSessionRecords: ClientSessionRecord[] = [
  {
    id: "client-session-1",
    title: "Strength Foundations",
    sessionType: "Group",
    status: "Check-in ready",
    period: "Upcoming",
    dayLabel: "Today",
    timeLabel: "6:30 PM",
    location: "Performance Floor A",
    coachName: "Ahmed Waheed",
    note: "Arrive a few minutes early for the warm-up.",
  },
  {
    id: "client-session-2",
    title: "Private Progress Check",
    sessionType: "Private",
    status: "Booked",
    period: "Upcoming",
    dayLabel: "Fri",
    timeLabel: "5:30 PM",
    location: "Private Studio 2",
    coachName: "Ahmed Waheed",
    note: "This session will review lower-body confidence and load progression.",
  },
  {
    id: "client-session-3",
    title: "Hybrid Athlete Lab",
    sessionType: "Group",
    status: "Completed",
    period: "Past",
    dayLabel: "Tue",
    timeLabel: "7:00 PM",
    location: "Floor A",
    coachName: "Ahmed Waheed",
    note: "Coach noted strong pacing and cleaner transitions between stations.",
  },
];
