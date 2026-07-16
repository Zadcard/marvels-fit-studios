import type { InjuryStatusLabel } from "@/lib/dashboard/client-domain-labels";

export type CoachSessionStatus = "Ready" | "Waitlist" | "Prep" | "Completed";
export type CoachSessionType = "Group" | "Private";
export type CoachSessionBookingStatus = "Booked" | "Attended" | "Missed" | "Waitlist";

export type CoachSessionBookingRecord = {
  clientId: string;
  fullName: string;
  status: CoachSessionBookingStatus;
  injuryStatus: InjuryStatusLabel;
  injuryNotes: string;
  restrictions: string;
  hasInjuryAlert: boolean;
};

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
  noteValue: string;
  bookings: CoachSessionBookingRecord[];
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
