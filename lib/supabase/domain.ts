import type { Database } from "@/lib/supabase/database.types";

type PublicEnums = Database["public"]["Enums"];

function enumValues<const T extends readonly string[]>(values: T) {
  return Object.fromEntries(values.map((value) => [value, value])) as {
    [K in T[number]]: K;
  };
}

export type BillingCycle = PublicEnums["BillingCycle"];
export const BillingCycle = enumValues(["MONTHLY", "WEEKLY", "CUSTOM"] as const);

export type BookingSource = PublicEnums["BookingSource"];
export const BookingSource = enumValues(["BLOCK", "MANUAL"] as const);

export type BookingStatus = PublicEnums["BookingStatus"];
export const BookingStatus = enumValues(
  [
    "BOOKED",
    "ATTENDED",
    "LATE",
    "MISSED",
    "EXCUSED",
    "CANCELED",
    "WAITLIST",
    "NO_SHOW",
    "RESCHEDULED",
  ] as const
);

export type ClientLifecycleStatus = PublicEnums["ClientLifecycleStatus"];
export const ClientLifecycleStatus = enumValues(
  ["ACTIVE", "PENDING", "PAUSED", "TRIAL", "INACTIVE", "DID_NOT_CONTINUE"] as const
);

export type ClientPaymentStatus = PublicEnums["ClientPaymentStatus"];
export const ClientPaymentStatus = enumValues(["PAID", "UNPAID", "DUE_SOON"] as const);

export type CoachSpecialization = PublicEnums["CoachSpecialization"];
export const CoachSpecialization = enumValues(
  [
    "STRENGTH",
    "CONDITIONING",
    "MOBILITY",
    "PRIVATE_COACHING",
    "FOOTBALL",
    "TENNIS",
    "CALISTHENICS",
    "REHAB",
    "ATHLETIC_PERFORMANCE",
    "GENERAL_FITNESS",
  ] as const
);

export type GroupType = PublicEnums["GroupType"];
export const GroupType = enumValues(["GROUP", "PRIVATE"] as const);

export type InjuryStatus = PublicEnums["InjuryStatus"];
export const InjuryStatus = enumValues(
  ["NONE", "CURRENT", "PREVIOUS", "REHAB"] as const
);

export type TrialOutcome = PublicEnums["TrialOutcome"];
export const TrialOutcome = enumValues(
  [
    "SUBSCRIBED",
    "FOLLOW_UP",
    "DID_NOT_CONTINUE",
    "NO_RESPONSE",
    "NO_SHOW",
    "NEEDS_DIFFERENT_OPTION",
  ] as const
);

export type TrainingCategory = string;
export const TrainingCategory = enumValues(
  [
    "FOOTBALL",
    "TENNIS",
    "OTHER_SPORT",
    "FAT_LOSS",
    "MUSCLE_GAIN",
    "CALISTHENICS",
    "REHAB",
    "GENERAL_FITNESS",
  ] as const
);

export type LeadStatus = PublicEnums["LeadStatus"];
export const LeadStatus = enumValues(["NEW", "CONTACTED", "CONVERTED", "CLOSED", "TRIAL_DONE"] as const);

export type SubscriptionStatus = PublicEnums["SubscriptionStatus"];
export const SubscriptionStatus = enumValues(
  ["ACTIVE", "TRIAL", "PAUSED", "EXPIRED", "CANCELED"] as const
);

export type TrainingSessionStatus = PublicEnums["TrainingSessionStatus"];
export const TrainingSessionStatus = enumValues(
  ["DRAFT", "SCHEDULED", "COMPLETED", "CANCELED"] as const
);

export type TrainingSessionType = PublicEnums["TrainingSessionType"];
export const TrainingSessionType = enumValues(["GROUP", "PRIVATE"] as const);

export type UserRole = PublicEnums["UserRole"];
export const UserRole = enumValues(["ADMIN", "COACH", "CLIENT"] as const);

export type TableName = keyof Database["public"]["Tables"];
export type Row<T extends TableName> = Database["public"]["Tables"][T]["Row"];
export type Insert<T extends TableName> = Database["public"]["Tables"][T]["Insert"];
export type Update<T extends TableName> = Database["public"]["Tables"][T]["Update"];
