export type CoachSessionStatus = "Ready" | "Waitlist" | "Prep" | "Completed";
export type CoachSessionType = "Group" | "Private";

export type CoachSessionRecord = {
  id: string;
  title: string;
  sessionType: CoachSessionType;
  status: CoachSessionStatus;
  dayLabel: string;
  timeLabel: string;
  location: string;
  rosterLabel: string;
  focus: string;
  note: string;
};

export const coachSessionTypeFilters: Array<"All" | CoachSessionType> = [
  "All",
  "Group",
  "Private",
];

export const coachSessionStatusFilters: Array<"All" | CoachSessionStatus> = [
  "All",
  "Ready",
  "Waitlist",
  "Prep",
  "Completed",
];

export const coachSessionRecords: CoachSessionRecord[] = [
  {
    id: "coach-session-strength-foundations",
    title: "Strength Foundations",
    sessionType: "Group",
    status: "Ready",
    dayLabel: "Today",
    timeLabel: "6:30 PM",
    location: "Performance Floor A",
    rosterLabel: "14 / 18 booked",
    focus: "Technique-led strength block for mixed-experience members.",
    note: "Two first-week members need quick movement regression options.",
  },
  {
    id: "coach-session-private-progress",
    title: "Private Progress Check",
    sessionType: "Private",
    status: "Prep",
    dayLabel: "Today",
    timeLabel: "8:00 PM",
    location: "Private Studio 2",
    rosterLabel: "Sara Nabil",
    focus: "Lower-body strength review and pacing adjustments.",
    note: "Bring forward last week's note about stability under fatigue.",
  },
  {
    id: "coach-session-hybrid-lab",
    title: "Hybrid Athlete Lab",
    sessionType: "Group",
    status: "Waitlist",
    dayLabel: "Tomorrow",
    timeLabel: "7:00 PM",
    location: "Floor A",
    rosterLabel: "16 / 18 booked",
    focus: "Crossover conditioning block for stronger intermediate members.",
    note: "Front desk may need overflow handling if two more members confirm.",
  },
  {
    id: "coach-session-movement-reset",
    title: "Movement Reset",
    sessionType: "Private",
    status: "Completed",
    dayLabel: "Tue",
    timeLabel: "5:30 PM",
    location: "Private Studio 1",
    rosterLabel: "Mona Adel",
    focus: "Technique reset and shoulder-loading confidence.",
    note: "Follow-up note still needs to be written before end of day.",
  },
];
