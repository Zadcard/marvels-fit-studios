import type { LucideIcon } from "lucide-react";

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

export type AdminOverviewData = {
  stats: AdminOverviewStat[];
  upcomingSessions: AdminUpcomingSession[];
  recentActivity: AdminRecentActivityItem[];
  quickActions: AdminQuickAction[];
  studioSnapshot: AdminStudioSnapshot[];
};
