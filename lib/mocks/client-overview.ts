import type { LucideIcon } from "lucide-react";
import {
  CalendarCheck2,
  CreditCard,
  ShieldUser,
  Target,
  TrendingUp,
} from "lucide-react";

import type { DashboardActivityFeedItem } from "@/components/dashboard/dashboard-activity-feed";

export type ClientOverviewStat = {
  id: string;
  label: string;
  value: string;
  change: string;
  detail: string;
  note: string;
  icon: LucideIcon;
  tone: "accent" | "success" | "warning" | "neutral";
};

export type ClientUpcomingSession = {
  id: string;
  title: string;
  dayLabel: string;
  timeLabel: string;
  sessionType: "Group" | "Private";
  location: string;
  coachName: string;
  status: "Booked" | "Check-in ready" | "Waitlist";
};

export type ClientCoachSnapshot = {
  fullName: string;
  roleLabel: string;
  specialization: string;
  nextTouchpoint: string;
  note: string;
};

export type ClientSubscriptionSnapshot = {
  planName: string;
  renewalLabel: string;
  paymentStatus: "Paid" | "Due soon";
  benefitLine: string;
};

export type ClientQuickAction = {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  ctaLabel: string;
  href: string;
};

export const clientOverviewData: {
  stats: ClientOverviewStat[];
  upcomingSessions: ClientUpcomingSession[];
  recentActivity: DashboardActivityFeedItem[];
  coachSnapshot: ClientCoachSnapshot;
  subscriptionSnapshot: ClientSubscriptionSnapshot;
  quickActions: ClientQuickAction[];
} = {
  stats: [
    {
      id: "sessions-this-week",
      label: "Sessions this week",
      value: "03",
      change: "1 completed",
      detail: "A calm weekly view of what is already booked and what is still coming up.",
      note: "Mock schedule",
      icon: CalendarCheck2,
      tone: "accent",
    },
    {
      id: "attendance",
      label: "Attendance pace",
      value: "92%",
      change: "Strong consistency",
      detail: "You are maintaining a solid rhythm across your current training cycle.",
      note: "Mock progress",
      icon: TrendingUp,
      tone: "success",
    },
    {
      id: "focus",
      label: "Current focus",
      value: "Strength",
      change: "Phase two",
      detail: "Your current plan is emphasizing cleaner lower-body strength progressions.",
      note: "Mock plan signal",
      icon: Target,
      tone: "neutral",
    },
  ],
  upcomingSessions: [
    {
      id: "client-upcoming-1",
      title: "Strength Foundations",
      dayLabel: "Today",
      timeLabel: "6:30 PM",
      sessionType: "Group",
      location: "Performance Floor A",
      coachName: "Ahmed Waheed",
      status: "Check-in ready",
    },
    {
      id: "client-upcoming-2",
      title: "Private Progress Check",
      dayLabel: "Fri",
      timeLabel: "5:30 PM",
      sessionType: "Private",
      location: "Private Studio 2",
      coachName: "Ahmed Waheed",
      status: "Booked",
    },
  ],
  recentActivity: [
    {
      id: "client-activity-1",
      title: "Coach note added",
      description: "Your squat pattern is improving and the next block will push tempo a little further.",
      timeLabel: "Yesterday",
      tone: "success",
    },
    {
      id: "client-activity-2",
      title: "Subscription renewed",
      description: "Your plan is active and ready for the next cycle.",
      timeLabel: "2 days ago",
      tone: "neutral",
    },
    {
      id: "client-activity-3",
      title: "Next class confirmed",
      description: "Strength Foundations is locked in for tonight at 6:30 PM.",
      timeLabel: "3 days ago",
      tone: "warning",
    },
  ],
  coachSnapshot: {
    fullName: "Ahmed Waheed",
    roleLabel: "Strength Coach",
    specialization: "Strength and group performance",
    nextTouchpoint: "Tonight after class",
    note: "Focused on steady progression, cleaner technique, and strong weekly consistency.",
  },
  subscriptionSnapshot: {
    planName: "Hybrid Elite",
    renewalLabel: "Renews Apr 28, 2026",
    paymentStatus: "Paid",
    benefitLine: "Includes group sessions, one private review each week, and progress check-ins.",
  },
  quickActions: [
    {
      id: "client-action-1",
      label: "Review my sessions",
      description: "See what's coming up next without digging through the full schedule.",
      icon: CalendarCheck2,
      ctaLabel: "Open sessions",
      href: "/client/sessions",
    },
    {
      id: "client-action-2",
      label: "Check my coach",
      description: "Jump into your coach summary and the next touchpoint details.",
      icon: ShieldUser,
      ctaLabel: "View coach",
      href: "/client/coach",
    },
    {
      id: "client-action-3",
      label: "See my plan",
      description: "Keep your current membership and renewal details easy to reach.",
      icon: CreditCard,
      ctaLabel: "View plan",
      href: "/client/subscription",
    },
  ],
};
