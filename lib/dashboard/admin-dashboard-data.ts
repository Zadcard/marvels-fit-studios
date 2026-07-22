import type {
  InjuryStatusLabel,
  LifecycleStatusLabel,
  TrialOutcomeLabel,
} from "@/lib/dashboard/client-domain-labels";
import { lifecycleStatusLabels } from "@/lib/dashboard/client-domain-labels";
import type { SubscriptionUrgencyStatus } from "@/lib/dashboard/subscription-status";

export type AdminClientStatus = LifecycleStatusLabel;
export type AdminClientMembership =
  | "Group Membership"
  | "Private Coaching"
  | "Hybrid";
export type AdminPaymentStatus = "Paid" | "Unpaid" | "Due soon";

export type AdminClientAttendanceRecord = {
  id: string;
  status: "ATTENDED" | "LATE" | "MISSED" | "EXCUSED" | "BOOKED" | "WAITLIST" | "NO_SHOW" | "CANCELED";
  sessionTitle: string;
  sessionType: string;
  coachName: string;
  dateLabel: string;
  timeLabel: string;
};

export type AdminClientRecord = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  membership: AdminClientMembership;
  categoryId: string | null;
  trainingCategory: string;
  sport: string;
  status: AdminClientStatus;
  trialOutcome: TrialOutcomeLabel;
  paymentStatus: AdminPaymentStatus;
  paymentAmountLabel: string;
  subscriptionStatus: SubscriptionUrgencyStatus;
  subscriptionDaysRemaining: number | null;
  sessionsLeft: number;
  sessionsTotal: number;
  injuryStatus: InjuryStatusLabel;
  injuryNotes: string;
  restrictions: string;
  hasInjuryAlert: boolean;
  joinedDate: string;
  groups: Array<{ id: string; name: string; coachName: string }>;
  assignedCoach: string;
  nextSession: string;
  nextSessions: string[];
  receipts: Array<{
    id: string;
    receiptNumber: string;
    amountLabel: string;
    dateLabel: string;
    method: string;
    href: string;
  }>;
  attendanceHistory: AdminClientAttendanceRecord[];
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

export const adminClientSubscriptionUrgencyFilters: Array<
  "All" | SubscriptionUrgencyStatus
> = ["All", "Expiring", "Active", "Inactive"];

export const adminClientMembershipFilters: Array<
  "All" | AdminClientMembership
> = ["All", "Group Membership", "Private Coaching", "Hybrid"];

export const adminPaymentStatusFilters: Array<"All" | AdminPaymentStatus> = [
  "All",
  "Paid",
  "Unpaid",
  "Due soon",
];

export type AdminLeadStatus = "New" | "Contacted" | "Trial done" | "Converted" | "Closed";

export type AdminLeadRecord = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  source: string;
  status: AdminLeadStatus;
  createdAt: string;
  message: string;
  trialGroupId: string | null;
  categoryId: string | null;
  interestedCategory: string | null;
  preferredAvailability: string | null;
  lostReason: string | null;
};

export const adminLeadStatusFilters: Array<"All" | AdminLeadStatus> = [
  "All",
  "New",
  "Contacted",
  "Trial done",
  "Converted",
  "Closed",
];

export type InactiveLeadOutcome = "Lost" | "Converted";

export type InactiveLeadRecord = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string;
  source: string;
  outcome: InactiveLeadOutcome;
  createdAtLabel: string;
  createdAtIso: string;
  message: string;
  interestedCategory: string | null;
  preferredAvailability: string | null;
  lostReason: string | null;
};

export type InactiveLeadDirectory = {
  records: InactiveLeadRecord[];
  totalCount: number;
  lostCount: number;
  convertedCount: number;
};

// A lead whose trial was marked complete (they attended) but who hasn't
// converted or been marked lost since -- i.e. gone quiet after showing up.
export type LapsedTrialRecord = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string;
  source: string;
  categoryId: string | null;
  interestedCategory: string | null;
  trialGroupId: string | null;
  trialGroupName: string | null;
  daysSinceTrial: number;
  trialCompletedLabel: string;
  message: string;
  preferredAvailability: string | null;
};

export type LapsedTrialDirectory = {
  records: LapsedTrialRecord[];
  totalCount: number;
};
