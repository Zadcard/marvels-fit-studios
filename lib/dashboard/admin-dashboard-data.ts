import type {
  InjuryStatusLabel,
  LifecycleStatusLabel,
  TrainingCategoryLabel,
  TrialOutcomeLabel,
} from "@/lib/dashboard/client-domain-labels";
import {
  lifecycleStatusLabels,
  trainingCategoryLabels,
} from "@/lib/dashboard/client-domain-labels";

export type AdminClientStatus = LifecycleStatusLabel;
export type AdminClientMembership =
  | "Group Membership"
  | "Private Coaching"
  | "Hybrid";
export type AdminPaymentStatus = "Paid" | "Unpaid" | "Due soon";

export type AdminClientRecord = {
  id: string;
  fullName: string;
  clientId: string;
  email: string;
  phone: string;
  membership: AdminClientMembership;
  trainingCategory: TrainingCategoryLabel;
  sport: string;
  status: AdminClientStatus;
  trialOutcome: TrialOutcomeLabel;
  paymentStatus: AdminPaymentStatus;
  paymentAmountLabel: string;
  injuryStatus: InjuryStatusLabel;
  injuryNotes: string;
  restrictions: string;
  hasInjuryAlert: boolean;
  joinedDate: string;
  primaryGroupId: string | null;
  primaryGroup: string;
  assignedCoach: string;
  nextSession: string;
  nextSessions: string[];
  progressNote: string;
};

export type AdminClientInitialOption = {
  label: string;
  count: number;
};

export const adminClientStatusFilters: Array<"All" | AdminClientStatus> = [
  "All",
  ...lifecycleStatusLabels,
];

export const adminClientMembershipFilters: Array<
  "All" | AdminClientMembership
> = ["All", "Group Membership", "Private Coaching", "Hybrid"];

export const adminTrainingCategoryFilters: Array<"All" | TrainingCategoryLabel> = [
  "All",
  ...trainingCategoryLabels,
];

export const adminPaymentStatusFilters: Array<"All" | AdminPaymentStatus> = [
  "All",
  "Paid",
  "Unpaid",
  "Due soon",
];

export type AdminLeadStatus = "New" | "Contacted" | "Converted" | "Closed";

export type AdminLeadRecord = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  source: string;
  status: AdminLeadStatus;
  createdAt: string;
  message: string;
};

export const adminLeadStatusFilters: Array<"All" | AdminLeadStatus> = [
  "All",
  "New",
  "Contacted",
  "Converted",
  "Closed",
];
