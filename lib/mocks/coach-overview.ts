import type { LucideIcon } from "lucide-react";
import {
  CalendarRange,
  ClipboardCheck,
  Clock3,
  Dumbbell,
  NotebookPen,
  Target,
  Users,
} from "lucide-react";

import type { DashboardActivityFeedItem } from "@/components/dashboard/dashboard-activity-feed";

export type CoachOverviewStat = {
  id: string;
  label: string;
  value: string;
  change: string;
  detail: string;
  note: string;
  icon: LucideIcon;
  tone: "accent" | "success" | "warning" | "neutral";
};

export type CoachOverviewSession = {
  id: string;
  title: string;
  dayLabel: string;
  timeLabel: string;
  location: string;
  sessionType: "Group" | "Private";
  status: "Ready" | "Waitlist" | "Prep";
  occupancyLabel: string;
};

export type CoachClientSpotlight = {
  id: string;
  fullName: string;
  focus: string;
  nextSession: string;
  momentum: string;
};

export type CoachQuickAction = {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  ctaLabel: string;
  href: string;
};

export type CoachPlanItem = {
  id: string;
  timeLabel: string;
  title: string;
  note: string;
};

export const coachOverviewData: {
  stats: CoachOverviewStat[];
  upcomingSessions: CoachOverviewSession[];
  clientSpotlights: CoachClientSpotlight[];
  recentActivity: DashboardActivityFeedItem[];
  quickActions: CoachQuickAction[];
  todaysPlan: CoachPlanItem[];
} = {
  stats: [
    {
      id: "sessions-today",
      label: "Sessions today",
      value: "04",
      change: "2 group, 2 private",
      detail: "A balanced coaching day with one prime-time session and focused private follow-up.",
      note: "Mock coaching load",
      icon: CalendarRange,
      tone: "accent",
    },
    {
      id: "clients-active",
      label: "Assigned clients",
      value: "18",
      change: "3 need review",
      detail: "Your active roster this cycle, filtered to the clients currently in your care.",
      note: "Mock roster signal",
      icon: Users,
      tone: "success",
    },
    {
      id: "check-ins",
      label: "Notes due",
      value: "06",
      change: "Before 9 PM",
      detail: "A small batch of post-session notes and follow-up messages are still waiting.",
      note: "Mock workflow cue",
      icon: NotebookPen,
      tone: "warning",
    },
    {
      id: "consistency",
      label: "Attendance pace",
      value: "91%",
      change: "Strong week",
      detail: "Most assigned members are on track with their current plan rhythm.",
      note: "Mock retention pulse",
      icon: Target,
      tone: "neutral",
    },
  ],
  upcomingSessions: [
    {
      id: "coach-session-1",
      title: "Strength Foundations",
      dayLabel: "Today",
      timeLabel: "6:30 PM",
      location: "Performance Floor A",
      sessionType: "Group",
      status: "Ready",
      occupancyLabel: "14 / 18 booked",
    },
    {
      id: "coach-session-2",
      title: "Private Progress Check",
      dayLabel: "Today",
      timeLabel: "8:00 PM",
      location: "Private Studio 2",
      sessionType: "Private",
      status: "Prep",
      occupancyLabel: "Sara Nabil",
    },
    {
      id: "coach-session-3",
      title: "Hybrid Athlete Lab",
      dayLabel: "Tomorrow",
      timeLabel: "7:00 PM",
      location: "Floor A",
      sessionType: "Group",
      status: "Waitlist",
      occupancyLabel: "16 / 18 booked",
    },
  ],
  clientSpotlights: [
    {
      id: "coach-client-1",
      fullName: "Karim Samir",
      focus: "Placement review and first-week confidence",
      nextSession: "Tomorrow, 5:00 PM",
      momentum: "New this week",
    },
    {
      id: "coach-client-2",
      fullName: "Nour Hassan",
      focus: "Lower-body load progression is trending well",
      nextSession: "Thu, 7:00 PM",
      momentum: "On track",
    },
    {
      id: "coach-client-3",
      fullName: "Mona Adel",
      focus: "Technique is clean, but recovery pacing needs attention",
      nextSession: "Fri, 5:30 PM",
      momentum: "Needs check-in",
    },
  ],
  recentActivity: [
    {
      id: "coach-activity-1",
      title: "Sara confirmed tonight's private session",
      description: "Arrival window is locked in, and focus notes are ready for review.",
      timeLabel: "18 min ago",
      tone: "success",
    },
    {
      id: "coach-activity-2",
      title: "Conditioning overflow flagged",
      description: "Tomorrow's group class is nearly full and may need a front-desk follow-up.",
      timeLabel: "42 min ago",
      tone: "warning",
    },
    {
      id: "coach-activity-3",
      title: "Three client logs still open",
      description: "Post-session notes for Tuesday's private sessions are still waiting.",
      timeLabel: "1 hr ago",
      tone: "neutral",
    },
  ],
  quickActions: [
    {
      id: "coach-action-1",
      label: "Open today's sessions",
      description: "Jump straight into the next coaching sessions and prep notes.",
      icon: Dumbbell,
      ctaLabel: "Review sessions",
      href: "/coach/sessions",
    },
    {
      id: "coach-action-2",
      label: "Log progress note",
      description: "Stage the habit of capturing form cues and client momentum after classes.",
      icon: ClipboardCheck,
      ctaLabel: "Open notes",
      href: "/coach/clients",
    },
    {
      id: "coach-action-3",
      label: "Check tomorrow's rhythm",
      description: "Look ahead without switching into the full schedule surface.",
      icon: Clock3,
      ctaLabel: "Preview",
      href: "/coach/schedule",
    },
  ],
  todaysPlan: [
    {
      id: "coach-plan-1",
      timeLabel: "4:30 PM",
      title: "Review private-session notes",
      note: "Refresh Sara's last strength checkpoint before the evening session.",
    },
    {
      id: "coach-plan-2",
      timeLabel: "6:30 PM",
      title: "Lead Strength Foundations",
      note: "Prime-time group class with several new members in the middle lane.",
    },
    {
      id: "coach-plan-3",
      timeLabel: "8:00 PM",
      title: "Private Progress Check",
      note: "Focus on squat pattern confidence and pacing adjustments.",
    },
  ],
};
