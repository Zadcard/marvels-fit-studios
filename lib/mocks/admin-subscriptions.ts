import type { LucideIcon } from "lucide-react";
import {
  BadgeDollarSign,
  CircleDollarSign,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";

export type AdminSubscriptionStatus =
  | "Active"
  | "Pending renewal"
  | "Canceled"
  | "Paused"
  | "Trial";
export type AdminPaymentStatus = "Paid" | "Due soon" | "Overdue" | "Manual review";
export const adminPaymentMethods = ["InstaPay", "Visa", "Cash"] as const;
export type AdminPaymentMethod = (typeof adminPaymentMethods)[number];
export type AdminPlanType =
  | "Group Membership"
  | "Private Coaching"
  | "Hybrid Elite"
  | "Starter Reset";

export type AdminSubscriptionStat = {
  id: string;
  label: string;
  value: string;
  change: string;
  detail: string;
  note: string;
  icon: LucideIcon;
  tone: "accent" | "success" | "warning" | "neutral";
};

export type AdminSubscriptionRecord = {
  id: string;
  clientId: string;
  planId: string;
  memberName: string;
  planName: AdminPlanType;
  subscriptionStatus: AdminSubscriptionStatus;
  paymentStatus: AdminPaymentStatus;
  assignedCoach: string;
  renewalDate: string;
  renewalDateValue: string;
  amountLabel: string;
  amountValue: string;
  billingCycle: string;
  sessionsLeft?: number;
  sessionsTotal?: number;
  note: string;
  paymentHistory: Array<{
    id: string;
    receiptId?: string;
    method?: AdminPaymentMethod;
    amountLabel: string;
    dateLabel: string;
    note: string;
  }>;
};

export const adminSubscriptionStatusFilters: Array<
  "All statuses" | AdminSubscriptionStatus
> = ["All statuses", "Active", "Pending renewal", "Paused", "Trial", "Canceled"];
export const adminPaymentStatusFilters: Array<
  "All payments" | AdminPaymentStatus
> = ["All payments", "Paid", "Due soon", "Overdue", "Manual review"];

export const adminPlanFilters: Array<"All plans" | AdminPlanType> = [
  "All plans",
  "Group Membership",
  "Private Coaching",
  "Hybrid Elite",
  "Starter Reset",
];

export const adminSubscriptionStats: AdminSubscriptionStat[] = [
  {
    id: "active-plans",
    label: "Active plans",
    value: "214",
    change: "12 trial upgrades",
    detail: "Current mix across recurring group, private, and hybrid memberships.",
    note: "Mock subscriptions",
    icon: ShieldCheck,
    tone: "accent",
  },
  {
    id: "renewals",
    label: "Renewals this week",
    value: "31",
    change: "7 need outreach",
    detail: "A manageable renewal wave with a few high-touch accounts to watch.",
    note: "Mock retention",
    icon: RefreshCcw,
    tone: "warning",
  },
  {
    id: "collected",
    label: "Collected this cycle",
    value: "EGP 96k",
    change: "On pace",
    detail: "Database-backed billing and subscription records.",
    note: "Mock finance",
    icon: CircleDollarSign,
    tone: "success",
  },
  {
    id: "at-risk",
    label: "At-risk accounts",
    value: "09",
    change: "2 overdue",
    detail: "A small set of accounts need follow-up before churn becomes likely.",
    note: "Mock alert",
    icon: BadgeDollarSign,
    tone: "neutral",
  },
];

export const adminSubscriptionRecords: AdminSubscriptionRecord[] = [
  {
    id: "subscription-1",
    clientId: "client-1",
    planId: "plan-1",
    memberName: "Nour Hassan",
    planName: "Hybrid Elite",
    subscriptionStatus: "Active",
    paymentStatus: "Paid",
    assignedCoach: "Ahmed Waheed",
    renewalDate: "Apr 12, 2026",
    renewalDateValue: "2026-04-12",
    amountLabel: "EGP 3,400",
    amountValue: "3400",
    billingCycle: "Monthly",
    note: "High-engagement member with both group and private attendance.",
    paymentHistory: [],
  },
  {
    id: "subscription-2",
    clientId: "client-2",
    planId: "plan-2",
    memberName: "Sara Nabil",
    planName: "Private Coaching",
    subscriptionStatus: "Pending renewal",
    paymentStatus: "Due soon",
    assignedCoach: "Reham Badawy",
    renewalDate: "Apr 08, 2026",
    renewalDateValue: "2026-04-08",
    amountLabel: "EGP 4,200",
    amountValue: "4200",
    billingCycle: "Monthly",
    note: "Renewal conversation should happen after Wednesday progress review.",
    paymentHistory: [],
  },
  {
    id: "subscription-3",
    clientId: "client-3",
    planId: "plan-3",
    memberName: "Mona Adel",
    planName: "Group Membership",
    subscriptionStatus: "Active",
    paymentStatus: "Paid",
    assignedCoach: "Karim Adel",
    renewalDate: "Apr 28, 2026",
    renewalDateValue: "2026-04-28",
    amountLabel: "EGP 1,850",
    amountValue: "1850",
    billingCycle: "Monthly",
    note: "Consistent attendance and low support burden.",
    paymentHistory: [],
  },
  {
    id: "subscription-4",
    clientId: "client-4",
    planId: "plan-4",
    memberName: "Dina Ragab",
    planName: "Starter Reset",
    subscriptionStatus: "Trial",
    paymentStatus: "Manual review",
    assignedCoach: "Hisham Mostafa",
    renewalDate: "Apr 06, 2026",
    renewalDateValue: "2026-04-06",
    amountLabel: "EGP 950",
    amountValue: "950",
    billingCycle: "Two weeks",
    note: "Trial extension is waiting for intake clarification.",
    paymentHistory: [],
  },
  {
    id: "subscription-5",
    clientId: "client-5",
    planId: "plan-5",
    memberName: "Yara Mostafa",
    planName: "Private Coaching",
    subscriptionStatus: "Paused",
    paymentStatus: "Overdue",
    assignedCoach: "Youssef Abdelatif",
    renewalDate: "Mar 31, 2026",
    renewalDateValue: "2026-03-31",
    amountLabel: "EGP 4,000",
    amountValue: "4000",
    billingCycle: "Monthly",
    note: "Paused after travel; payment follow-up should stay gentle.",
    paymentHistory: [],
  },
  {
    id: "subscription-6",
    clientId: "client-6",
    planId: "plan-6",
    memberName: "Tamer Adel",
    planName: "Group Membership",
    subscriptionStatus: "Pending renewal",
    paymentStatus: "Due soon",
    assignedCoach: "Ahmed Farouk",
    renewalDate: "Apr 10, 2026",
    renewalDateValue: "2026-04-10",
    amountLabel: "EGP 1,850",
    amountValue: "1850",
    billingCycle: "Monthly",
    note: "Likely renewal if evening slot preference is preserved.",
    paymentHistory: [],
  },
];
