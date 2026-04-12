import type { LucideIcon } from "lucide-react";
import { BellRing, ShieldCheck, TimerReset, Trophy } from "lucide-react";

export type AdminProfileMetric = {
  id: string;
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
};

export type AdminProfilePreferences = {
  emailUpdates: boolean;
  mobileAlerts: boolean;
  renewalEscalations: boolean;
};

export type AdminProfileRecord = {
  fullName: string;
  roleLabel: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  initials: string;
  joinedLabel: string;
  credentialsNote: string;
};

export const adminProfileRecord: AdminProfileRecord = {
  fullName: "Layla Mourad",
  roleLabel: "Studio Director",
  email: "layla@marvelfitness.studio",
  phone: "+20 10 8844 1236",
  location: "Cairo, Egypt",
  bio: "Leads studio operations, shapes coaching standards, and keeps the client journey polished from first contact to renewal.",
  initials: "LM",
  joinedLabel: "Joined August 2023",
  credentialsNote:
    "Password changes are handled securely from the profile page.",
};

export const adminProfileMetrics: AdminProfileMetric[] = [
  {
    id: "approvals",
    label: "Pending approvals",
    value: "05",
    detail: "Session and renewal decisions that still need admin confirmation.",
    icon: ShieldCheck,
  },
  {
    id: "response-time",
    label: "Ops response time",
    value: "18 min",
    detail: "Average turnaround for front-desk escalations this week.",
    icon: TimerReset,
  },
  {
    id: "member-sentiment",
    label: "Member sentiment",
    value: "4.8/5",
    detail: "Mock satisfaction pulse across onboarding and coaching follow-up.",
    icon: Trophy,
  },
  {
    id: "alerts",
    label: "Live alerts",
    value: "03",
    detail: "Current notification threads that still need attention.",
    icon: BellRing,
  },
];

export const adminProfilePreferences: AdminProfilePreferences = {
  emailUpdates: true,
  mobileAlerts: true,
  renewalEscalations: false,
};
