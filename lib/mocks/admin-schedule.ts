import type { LucideIcon } from "lucide-react";
import {
  CalendarClock,
  Clock3,
  Target,
  UsersRound,
} from "lucide-react";

export type AdminScheduleSessionType = "Group" | "Private";
export type AdminScheduleSessionStatus =
  | "Confirmed"
  | "Waitlist"
  | "Attention"
  | "Completed";

export type AdminScheduleStat = {
  id: string;
  label: string;
  value: string;
  change: string;
  detail: string;
  note: string;
  icon: LucideIcon;
  tone: "accent" | "success" | "warning" | "neutral";
};

export type AdminScheduleSessionRecord = {
  id: string;
  title: string;
  sessionType: AdminScheduleSessionType;
  status: AdminScheduleSessionStatus;
  dayKey: string;
  dayLabel: string;
  dateLabel: string;
  timeRange: string;
  coachName: string;
  location: string;
  occupancyLabel: string;
  attendanceNote: string;
  focus: string;
  highlight: string;
};

export const adminScheduleDayFilters = [
  "All days",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const adminScheduleStatusFilters: Array<
  "All statuses" | AdminScheduleSessionStatus
> = ["All statuses", "Confirmed", "Waitlist", "Attention", "Completed"];

export const adminScheduleSessionTypeFilters: Array<
  "All types" | AdminScheduleSessionType
> = ["All types", "Group", "Private"];

export const adminScheduleStats: AdminScheduleStat[] = [
  {
    id: "weekly-slots",
    label: "Weekly slots",
    value: "28",
    change: "4 focus blocks added",
    detail: "A balanced mix of prime-time group classes and private follow-ups.",
    note: "Mock schedule signal",
    icon: CalendarClock,
    tone: "accent",
  },
  {
    id: "coach-coverage",
    label: "Coach coverage",
    value: "96%",
    change: "1 handoff pending",
    detail: "Most sessions already have confirmed lead ownership for the week.",
    note: "Mock coverage metric",
    icon: Target,
    tone: "success",
  },
  {
    id: "peak-hours",
    label: "Peak block",
    value: "6-9 PM",
    change: "Tue and Thu busiest",
    detail: "Evening demand is clustering around strength and conditioning blocks.",
    note: "Mock pattern",
    icon: Clock3,
    tone: "warning",
  },
  {
    id: "occupancy",
    label: "Occupancy pace",
    value: "82%",
    change: "Waitlist forming",
    detail: "Group sessions are nearly full while private slots still have room.",
    note: "Mock occupancy",
    icon: UsersRound,
    tone: "neutral",
  },
];

export const adminScheduleSessionRecords: AdminScheduleSessionRecord[] = [
  {
    id: "mon-strength-foundations",
    title: "Strength Foundations",
    sessionType: "Group",
    status: "Confirmed",
    dayKey: "Monday",
    dayLabel: "Monday",
    dateLabel: "Apr 6",
    timeRange: "6:30 PM - 7:30 PM",
    coachName: "Ahmed Waheed",
    location: "Performance Floor A",
    occupancyLabel: "14 / 18 booked",
    attendanceNote: "Steady signups through the afternoon.",
    focus: "Lower-body strength progression for mixed-experience members.",
    highlight: "Prime-time cornerstone class",
  },
  {
    id: "mon-private-reset",
    title: "Private Reset Session",
    sessionType: "Private",
    status: "Confirmed",
    dayKey: "Monday",
    dayLabel: "Monday",
    dateLabel: "Apr 6",
    timeRange: "8:00 PM - 8:45 PM",
    coachName: "Reham Badawy",
    location: "Private Studio 2",
    occupancyLabel: "1 / 1 booked",
    attendanceNote: "Sara Nabil confirmed arrival window.",
    focus: "Technique reset and confidence rebuild after two missed sessions.",
    highlight: "Client retention touchpoint",
  },
  {
    id: "tue-conditioning-lab",
    title: "Conditioning Lab",
    sessionType: "Group",
    status: "Waitlist",
    dayKey: "Tuesday",
    dayLabel: "Tuesday",
    dateLabel: "Apr 7",
    timeRange: "5:00 PM - 6:00 PM",
    coachName: "Ahmed Farouk",
    location: "Performance Floor B",
    occupancyLabel: "20 / 20 booked",
    attendanceNote: "Overflow names already queued for follow-up.",
    focus: "High-output circuit with pacing blocks and recovery intervals.",
    highlight: "Overflow risk",
  },
  {
    id: "tue-mobility-flow",
    title: "Mobility Flow",
    sessionType: "Group",
    status: "Attention",
    dayKey: "Tuesday",
    dayLabel: "Tuesday",
    dateLabel: "Apr 7",
    timeRange: "7:30 PM - 8:15 PM",
    coachName: "Youssef Abdelatif",
    location: "Recovery Studio",
    occupancyLabel: "6 / 12 booked",
    attendanceNote: "Needs promotional push to avoid a soft night block.",
    focus: "Recovery-led mobility with shoulder and hip opening emphasis.",
    highlight: "Needs visibility",
  },
  {
    id: "wed-private-check-in",
    title: "Private Progress Check",
    sessionType: "Private",
    status: "Confirmed",
    dayKey: "Wednesday",
    dayLabel: "Wednesday",
    dateLabel: "Apr 8",
    timeRange: "6:15 PM - 7:00 PM",
    coachName: "Hisham Mostafa",
    location: "Private Studio 1",
    occupancyLabel: "1 / 1 booked",
    attendanceNote: "Client requested updated load targets.",
    focus: "Monthly review of squat mechanics and progression pacing.",
    highlight: "Assessment block",
  },
  {
    id: "thu-hybrid-athlete-lab",
    title: "Hybrid Athlete Lab",
    sessionType: "Group",
    status: "Confirmed",
    dayKey: "Thursday",
    dayLabel: "Thursday",
    dateLabel: "Apr 9",
    timeRange: "7:00 PM - 8:00 PM",
    coachName: "Karim Adel",
    location: "Floor A",
    occupancyLabel: "16 / 18 booked",
    attendanceNote: "Strong energy, likely to close before noon.",
    focus: "Strength and conditioning crossover for advanced members.",
    highlight: "High-demand premium block",
  },
  {
    id: "fri-private-bridge",
    title: "Private Return-to-Training",
    sessionType: "Private",
    status: "Attention",
    dayKey: "Friday",
    dayLabel: "Friday",
    dateLabel: "Apr 10",
    timeRange: "4:30 PM - 5:15 PM",
    coachName: "Reham Badawy",
    location: "Private Studio 2",
    occupancyLabel: "Pending confirmation",
    attendanceNote: "Client has not yet confirmed transport timing.",
    focus: "Careful re-entry after travel week and missed sleep cycle.",
    highlight: "Needs confirmation call",
  },
  {
    id: "sat-power-circuit",
    title: "Power Circuit",
    sessionType: "Group",
    status: "Completed",
    dayKey: "Saturday",
    dayLabel: "Saturday",
    dateLabel: "Apr 11",
    timeRange: "11:00 AM - 12:00 PM",
    coachName: "Ahmed Waheed",
    location: "Floor B",
    occupancyLabel: "18 / 18 attended",
    attendanceNote: "Excellent turnout and clean start times.",
    focus: "Weekend intensity block with partner stations and tempo work.",
    highlight: "Strong member momentum",
  },
];
