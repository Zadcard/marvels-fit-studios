import type { InjuryStatusLabel } from "@/lib/dashboard/client-domain-labels";

export type AttendanceActionStatus =
  | "ATTENDED"
  | "LATE"
  | "MISSED"
  | "EXCUSED"
  | "NO_SHOW"
  | "RESCHEDULED"
  | "CANCELED";

export type AttendanceLabel =
  | "Booked"
  | "Attended"
  | "Late"
  | "Absent"
  | "Excused"
  | "No-show"
  | "Rescheduled"
  | "Cancelled"
  | "Waitlisted";

export type AdminAttendanceAttendee = {
  clientId: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  groupName?: string | null;
  categoryName?: string | null;
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
  startsAt?: string;
  coachName: string;
  sessionType: "Group" | "Private";
  trainingCategory: string | null;
  attendees: AdminAttendanceAttendee[];
};

export const attendanceActions: Array<{
  label: string;
  status: AttendanceActionStatus;
  tone: "success" | "warning" | "danger" | "neutral";
}> = [
  { label: "Attended", status: "ATTENDED", tone: "success" },
  { label: "Late", status: "LATE", tone: "warning" },
  { label: "Absent", status: "MISSED", tone: "warning" },
  { label: "Excused", status: "EXCUSED", tone: "neutral" },
  { label: "No-show", status: "NO_SHOW", tone: "danger" },
  { label: "Rescheduled", status: "RESCHEDULED", tone: "neutral" },
  { label: "Cancelled", status: "CANCELED", tone: "neutral" },
];
