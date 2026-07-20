import type { LucideIcon } from "lucide-react";
import {
  CalendarPlus2,
  CircleDollarSign,
  ClipboardPlus,
  Dumbbell,
  ShieldUser,
  UserPlus,
  Users,
} from "lucide-react";

export type AdminOverviewStat = {
  id: string;
  label: string;
  value: string;
  change: string;
  detail: string;
  note: string;
  icon: LucideIcon;
  tone: "accent" | "success" | "warning" | "neutral";
};

export type AdminUpcomingSession = {
  id: string;
  dayLabel: string;
  timeLabel: string;
  name: string;
  coachName: string;
  location: string;
  sessionType: "Group" | "Private";
  bookedSeats: number;
  capacity: number;
  status: "On track" | "Waitlist forming" | "Needs follow-up";
};

export type AdminRecentActivityItem = {
  id: string;
  title: string;
  description: string;
  timeLabel: string;
  tone: "success" | "warning" | "neutral";
};

export type AdminQuickAction = {
  id: string;
  label: string;
  description: string;
  ctaLabel: string;
  href: string;
  icon: LucideIcon;
  emphasis: "primary" | "secondary";
};

export type AdminStudioSnapshot = {
  id: string;
  label: string;
  value: string;
  description: string;
};

export const adminOverviewData: {
  stats: AdminOverviewStat[];
  upcomingSessions: AdminUpcomingSession[];
  recentActivity: AdminRecentActivityItem[];
  quickActions: AdminQuickAction[];
  studioSnapshot: AdminStudioSnapshot[];
} = {
  stats: [
    {
      id: "members",
      label: "Total members",
      value: "248",
      change: "+12 this month",
      detail: "Active roster across group and private memberships.",
      note: "Mock metric",
      icon: Users,
      tone: "accent",
    },
    {
      id: "coaches",
      label: "Active coaches",
      value: "6",
      change: "Full coverage",
      detail: "Every session this week has a confirmed coach lead.",
      note: "Mock metric",
      icon: ShieldUser,
      tone: "success",
    },
    {
      id: "sessions",
      label: "Sessions this week",
      value: "34",
      change: "+4 vs last week",
      detail: "Combined group classes and private coaching appointments.",
      note: "Mock metric",
      icon: Dumbbell,
      tone: "neutral",
    },
    {
      id: "revenue",
      label: "Revenue this month",
      value: "EGP 148k",
      change: "Under review",
      detail: "Monthly revenue trend for the current billing cycle.",
      note: "Mock metric",
      icon: CircleDollarSign,
      tone: "warning",
    },
  ],
  upcomingSessions: [
    {
      id: "session-1",
      dayLabel: "Today",
      timeLabel: "6:30 PM",
      name: "Strength Foundations",
      coachName: "Ahmed Waheed",
      location: "Floor A",
      sessionType: "Group",
      bookedSeats: 14,
      capacity: 18,
      status: "On track",
    },
    {
      id: "session-2",
      dayLabel: "Today",
      timeLabel: "8:00 PM",
      name: "Private Progress Check",
      coachName: "Youssef Abdelatif",
      location: "Private Zone",
      sessionType: "Private",
      bookedSeats: 1,
      capacity: 1,
      status: "On track",
    },
    {
      id: "session-3",
      dayLabel: "Tomorrow",
      timeLabel: "5:00 PM",
      name: "Conditioning Lab",
      coachName: "Ahmed Farouk",
      location: "Floor B",
      sessionType: "Group",
      bookedSeats: 20,
      capacity: 20,
      status: "Waitlist forming",
    },
  ],
  recentActivity: [
    {
      id: "activity-1",
      title: "New member onboarded",
      description: "Nour Hassan completed intake and was assigned to Group B.",
      timeLabel: "12 min ago",
      tone: "success",
    },
    {
      id: "activity-2",
      title: "Capacity alert on Conditioning Lab",
      description: "Tomorrow's 5:00 PM session is full and may need overflow handling.",
      timeLabel: "38 min ago",
      tone: "warning",
    },
    {
      id: "activity-3",
      title: "Coach update submitted",
      description: "Hisham Mostafa added follow-up notes for three private clients.",
      timeLabel: "1 hr ago",
      tone: "neutral",
    },
    {
      id: "activity-4",
      title: "Membership renewal pending",
      description: "Seven members are due for renewal review before the weekend.",
      timeLabel: "2 hr ago",
      tone: "warning",
    },
  ],
  quickActions: [
    {
      id: "action-1",
      label: "Add new client",
      description: "Open the roster and start a new client record.",
      ctaLabel: "Open",
      href: "/admin/clients",
      icon: UserPlus,
      emphasis: "primary",
    },
    {
      id: "action-2",
      label: "Create session",
      description: "Open the session workspace and set the next class.",
      ctaLabel: "Launch",
      href: "/admin/schedule",
      icon: CalendarPlus2,
      emphasis: "secondary",
    },
    {
      id: "action-3",
      label: "Assign coach",
      description: "Review coach capacity and assign the right lead.",
      ctaLabel: "Review",
      href: "/admin/coaches",
      icon: ShieldUser,
      emphasis: "secondary",
    },
    {
      id: "action-4",
      label: "Capture note",
      description: "Track schedule notes, flags, and handoff items.",
      ctaLabel: "Open",
      href: "/admin/schedule",
      icon: ClipboardPlus,
      emphasis: "secondary",
    },
  ],
  studioSnapshot: [
    {
      id: "snapshot-1",
      label: "Onboarding queue",
      value: "09",
      description: "Members waiting for class placement or first-session confirmation.",
    },
    {
      id: "snapshot-2",
      label: "Plan demand",
      value: "68%",
      description: "Share of current members leaning toward group training this cycle.",
    },
    {
      id: "snapshot-3",
      label: "Energy note",
      value: "Strong",
      description: "Attendance and coach coverage are tracking above the weekly baseline.",
    },
    {
      id: "snapshot-4",
      label: "Focus next",
      value: "Clients",
      description: "Client management remains the busiest operational surface this week.",
    },
  ],
};
