import type { InjuryStatusLabel } from "@/lib/dashboard/client-domain-labels";

// The attendance action's raw booking statuses and the human labels the fast
// roster shows. "Absent" maps to MISSED; the rest map 1:1.
export type AttendanceActionStatus =
  | "ATTENDED"
  | "MISSED"
  | "NO_SHOW"
  | "RESCHEDULED"
  | "CANCELED";

export type AttendanceLabel =
  | "Booked"
  | "Attended"
  | "Absent"
  | "No-show"
  | "Rescheduled"
  | "Cancelled"
  | "Waitlisted";

export type AdminAttendanceAttendee = {
  clientId: string;
  fullName: string;
  status: AttendanceLabel;
  isTrial: boolean;
  hasInjuryAlert: boolean;
  injuryStatus: InjuryStatusLabel;
  injuryNotes: string;
};

export type AdminAttendanceSession = {
  id: string;
  title: string;
  timeLabel: string;
  coachName: string;
  sessionType: "Group" | "Private";
  trainingCategory: string | null;
  location: string;
  attendees: AdminAttendanceAttendee[];
};

export const attendanceActions: Array<{
  label: string;
  status: AttendanceActionStatus;
  tone: "success" | "warning" | "danger" | "neutral";
}> = [
  { label: "Attended", status: "ATTENDED", tone: "success" },
  { label: "Absent", status: "MISSED", tone: "warning" },
  { label: "No-show", status: "NO_SHOW", tone: "danger" },
  { label: "Rescheduled", status: "RESCHEDULED", tone: "neutral" },
  { label: "Cancelled", status: "CANCELED", tone: "neutral" },
];
