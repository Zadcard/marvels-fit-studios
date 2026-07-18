import type { DashboardActivityFeedItem } from "@/lib/dashboard/activity-feed";
import type { DashboardStatIconKey } from "@/lib/dashboard/workspace-definition";

export type CoachOverviewStat = {
  id: string;
  label: string;
  value: string;
  change: string;
  detail: string;
  note: string;
  icon: DashboardStatIconKey;
  tone: "accent" | "success" | "warning" | "neutral";
};

export type CoachOverviewSession = {
  id: string;
  title: string;
  dayLabel: string;
  timeLabel: string;
  location: string;
  sessionType: "Group" | "Private";
  status: "Ready" | "Waitlist" | "Prep" | "Completed";
  occupancyLabel: string;
};

export type CoachClientSpotlight = {
  id: string;
  fullName: string;
  focus: string;
  nextSession: string;
  momentum: string;
};

export type CoachPlanItem = {
  id: string;
  timeLabel: string;
  title: string;
  note: string;
};

export type CoachOverviewData = {
  stats: CoachOverviewStat[];
  upcomingSessions: CoachOverviewSession[];
  clientSpotlights: CoachClientSpotlight[];
  recentActivity: DashboardActivityFeedItem[];
  todaysPlan: CoachPlanItem[];
};
