export type CoachClientStatus =
  | "On track"
  | "Needs check-in"
  | "New this week"
  | "Recovery focus";

export type CoachClientPlan = "Group" | "Private" | "Hybrid";

export type CoachClientRecord = {
  id: string;
  fullName: string;
  phone: string;
  planType: CoachClientPlan;
  status: CoachClientStatus;
  nextSession: string;
  lastTouchpoint: string;
  currentFocus: string;
  progressNote: string;
  groupId: string | null;
  groupName: string;
  privateNotes: Array<{
    id: string;
    content: string;
    authorName: string;
    updatedAtLabel: string;
  }>;
  activeFiles: Array<{
    id: string;
    name: string;
    note: string;
    expiresAtLabel: string;
  }>;
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
