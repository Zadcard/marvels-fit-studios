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
  paymentStatus: string;
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

export type ClientOverviewData = {
  stats: ClientOverviewStat[];
  upcomingSessions: ClientUpcomingSession[];
  recentActivity: DashboardActivityFeedItem[];
  coachSnapshot: ClientCoachSnapshot;
  subscriptionSnapshot: ClientSubscriptionSnapshot;
  quickActions: ClientQuickAction[];
  activeFiles: ClientFileRecord[];
};

export type ClientFileRecord = {
  id: string;
  name: string;
  note: string;
  uploadedAtLabel: string;
  expiresAtLabel: string;
  downloadHref: string;
};

export type ClientCoachRecord = {
  fullName: string;
  roleLabel: string;
  specialization: string;
  email: string;
  phone: string;
  bio: string;
  nextSession: string;
  coachingNote: string;
};

export type ClientSubscriptionRecord = {
  planName: string;
  status: string;
  paymentStatus: string;
  renewalDate: string;
  amountLabel: string;
  billingCycle: string;
  benefits: string[];
  note: string;
  paymentHistory: Array<{
    id: string;
    amountLabel: string;
    dateLabel: string;
    note: string;
  }>;
};

export type ClientSessionStatus =
  | "Booked"
  | "Check-in ready"
  | "Waitlist"
  | "You attended"
  | "You missed"
  | "Cancelled";
export type ClientSessionType = "Group" | "Private";
export type ClientSessionPeriod = "Upcoming" | "Past";

export type ClientSessionRecord = {
  id: string;
  title: string;
  sessionType: ClientSessionType;
  status: ClientSessionStatus;
  period: ClientSessionPeriod;
  dayLabel: string;
  timeLabel: string;
  location: string;
  coachName: string;
  note: string;
};

export const clientSessionPeriodFilters: Array<"All" | ClientSessionPeriod> = [
  "All",
  "Upcoming",
  "Past",
];

export const clientSessionTypeFilters: Array<"All" | ClientSessionType> = [
  "All",
  "Group",
  "Private",
];

export type ClientSettingsRecord = {
  fullName: string;
  email: string;
  phone: string;
  goalLabel: string;
  preferredSessionTime: string;
};

export const clientSettingsOptions = {
  preferredSessionTimes: ["Evenings", "Mornings", "Flexible"],
};

export const clientQuickActions: ClientQuickAction[] = [
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
];

export const clientOverviewStatIcons = {
  sessions: CalendarCheck2,
  attendance: TrendingUp,
  focus: Target,
};
