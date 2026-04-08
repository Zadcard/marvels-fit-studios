export type AdminSessionStatus =
  | "Scheduled"
  | "Waitlist"
  | "Completed"
  | "Draft"
  | "Canceled";

export type AdminSessionRecord = {
  id: string;
  title: string;
  coachName: string;
  dayLabel: string;
  timeLabel: string;
  location: string;
  status: AdminSessionStatus;
};

export type AdminGroupSessionRecord = AdminSessionRecord & {
  capacity: number;
  enrolled: number;
};

export type AdminPrivateSessionRecord = AdminSessionRecord & {
  clientName: string;
  focus: string;
};

export const adminSessionStatusFilters: Array<"All" | AdminSessionStatus> = [
  "All",
  "Scheduled",
  "Waitlist",
  "Completed",
  "Draft",
  "Canceled",
];

export const adminGroupSessionRecords: AdminGroupSessionRecord[] = [
  {
    id: "group-strength-foundations",
    title: "Strength Foundations",
    coachName: "Ahmed Waheed",
    dayLabel: "Today",
    timeLabel: "6:30 PM",
    location: "Floor A",
    status: "Scheduled",
    capacity: 18,
    enrolled: 14,
  },
  {
    id: "group-conditioning-lab",
    title: "Conditioning Lab",
    coachName: "Ahmed Farouk",
    dayLabel: "Tomorrow",
    timeLabel: "5:00 PM",
    location: "Floor B",
    status: "Waitlist",
    capacity: 20,
    enrolled: 20,
  },
  {
    id: "group-mobility-reset",
    title: "Mobility Reset",
    coachName: "Youssef Abdelatif",
    dayLabel: "Thu",
    timeLabel: "7:30 PM",
    location: "Recovery Studio",
    status: "Draft",
    capacity: 12,
    enrolled: 4,
  },
];

export const adminPrivateSessionRecords: AdminPrivateSessionRecord[] = [
  {
    id: "private-sara-progress",
    title: "Private Progress Check",
    coachName: "Youssef Abdelatif",
    clientName: "Sara Nabil",
    dayLabel: "Today",
    timeLabel: "8:00 PM",
    location: "Private Zone",
    status: "Scheduled",
    focus: "Lower-body strength cycle review",
  },
  {
    id: "private-mona-reset",
    title: "Movement Reset",
    coachName: "Hisham Mostafa",
    clientName: "Mona Adel",
    dayLabel: "Thu",
    timeLabel: "5:30 PM",
    location: "Private Zone",
    status: "Scheduled",
    focus: "Technique check and progression update",
  },
  {
    id: "private-dina-wrap",
    title: "Hybrid Follow-up",
    coachName: "Reham Badawy",
    clientName: "Dina Ragab",
    dayLabel: "Mon",
    timeLabel: "6:00 PM",
    location: "Private Zone",
    status: "Completed",
    focus: "Monthly recap and next-cycle planning",
  },
];
