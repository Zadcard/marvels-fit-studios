export type CoachClientStatus =
  | "On track"
  | "Needs check-in"
  | "New this week"
  | "Recovery focus";
export type CoachClientPlan = "Group" | "Private" | "Hybrid";

export type CoachClientRecord = {
  id: string;
  fullName: string;
  planType: CoachClientPlan;
  status: CoachClientStatus;
  nextSession: string;
  lastTouchpoint: string;
  currentFocus: string;
  progressNote: string;
};

export const coachClientStatusFilters: Array<"All" | CoachClientStatus> = [
  "All",
  "On track",
  "Needs check-in",
  "New this week",
  "Recovery focus",
];

export const coachClientPlanFilters: Array<"All" | CoachClientPlan> = [
  "All",
  "Group",
  "Private",
  "Hybrid",
];

export const coachClientRecords: CoachClientRecord[] = [
  {
    id: "coach-client-karim",
    fullName: "Karim Samir",
    planType: "Group",
    status: "New this week",
    nextSession: "Tomorrow, 5:00 PM",
    lastTouchpoint: "Placement review yesterday",
    currentFocus: "Settling into the strength floor and building confidence.",
    progressNote: "Responds well to verbal pacing cues and smaller first sets.",
  },
  {
    id: "coach-client-nour",
    fullName: "Nour Hassan",
    planType: "Hybrid",
    status: "On track",
    nextSession: "Thu, 7:00 PM",
    lastTouchpoint: "Private recap on Monday",
    currentFocus: "Lower-body load progression with cleaner tempo control.",
    progressNote: "Ready for a small progression jump if recovery stays stable.",
  },
  {
    id: "coach-client-mona",
    fullName: "Mona Adel",
    planType: "Private",
    status: "Recovery focus",
    nextSession: "Fri, 5:30 PM",
    lastTouchpoint: "Movement reset this week",
    currentFocus: "Technique and recovery pacing after a busy travel period.",
    progressNote: "Keep intensity moderate and reinforce cleaner shoulder mechanics.",
  },
  {
    id: "coach-client-sara",
    fullName: "Sara Nabil",
    planType: "Private",
    status: "On track",
    nextSession: "Today, 8:00 PM",
    lastTouchpoint: "Program note sent yesterday",
    currentFocus: "Strength confidence and consistency across private blocks.",
    progressNote: "Great compliance so far; form quality is improving under load.",
  },
  {
    id: "coach-client-yara",
    fullName: "Yara Mostafa",
    planType: "Hybrid",
    status: "Needs check-in",
    nextSession: "Not booked",
    lastTouchpoint: "Missed class on Tuesday",
    currentFocus: "Rebuilding rhythm after a disrupted two-week stretch.",
    progressNote: "Needs a supportive follow-up before commitment slips further.",
  },
];
