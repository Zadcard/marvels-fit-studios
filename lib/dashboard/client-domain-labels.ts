import type {
  ClientLifecycleStatus,
  InjuryStatus,
  TrainingCategory,
  TrialOutcome,
} from "@/lib/supabase/domain";

// Human-readable labels for the client training category and injury status.
// These are the operational vocabulary Marvel uses; the enum values are the
// storage form. Keeping the mapping in one pure module lets both server code
// (repositories, actions) and client components share it without duplication.

export const trainingCategoryLabels = [
  "Football",
  "Tennis",
  "Other sport",
  "Fat loss",
  "Muscle gain",
  "Calisthenics",
  "Rehab",
  "General fitness",
] as const;

export type TrainingCategoryLabel = (typeof trainingCategoryLabels)[number];

export const injuryStatusLabels = [
  "None",
  "Current injury",
  "Previous injury",
  "In rehab",
] as const;

export type InjuryStatusLabel = (typeof injuryStatusLabels)[number];

const trainingCategoryToLabel: Record<TrainingCategory, TrainingCategoryLabel> = {
  FOOTBALL: "Football",
  TENNIS: "Tennis",
  OTHER_SPORT: "Other sport",
  FAT_LOSS: "Fat loss",
  MUSCLE_GAIN: "Muscle gain",
  CALISTHENICS: "Calisthenics",
  REHAB: "Rehab",
  GENERAL_FITNESS: "General fitness",
};

const labelToTrainingCategory: Record<TrainingCategoryLabel, TrainingCategory> = {
  Football: "FOOTBALL",
  Tennis: "TENNIS",
  "Other sport": "OTHER_SPORT",
  "Fat loss": "FAT_LOSS",
  "Muscle gain": "MUSCLE_GAIN",
  Calisthenics: "CALISTHENICS",
  Rehab: "REHAB",
  "General fitness": "GENERAL_FITNESS",
};

const injuryStatusToLabel: Record<InjuryStatus, InjuryStatusLabel> = {
  NONE: "None",
  CURRENT: "Current injury",
  PREVIOUS: "Previous injury",
  REHAB: "In rehab",
};

const labelToInjuryStatus: Record<InjuryStatusLabel, InjuryStatus> = {
  None: "NONE",
  "Current injury": "CURRENT",
  "Previous injury": "PREVIOUS",
  "In rehab": "REHAB",
};

export function trainingCategoryLabelFor(
  value: TrainingCategory
): TrainingCategoryLabel {
  return trainingCategoryToLabel[value] ?? "General fitness";
}

export function trainingCategoryFromLabel(
  label: string
): TrainingCategory {
  return labelToTrainingCategory[label as TrainingCategoryLabel] ?? "GENERAL_FITNESS";
}

export function injuryStatusLabelFor(value: InjuryStatus): InjuryStatusLabel {
  return injuryStatusToLabel[value] ?? "None";
}

export function injuryStatusFromLabel(label: string): InjuryStatus {
  return labelToInjuryStatus[label as InjuryStatusLabel] ?? "NONE";
}

// A client needs an at-a-glance safety alert when they are actively injured or
// still going through rehab. Previous (healed) injuries stay informational.
export function injuryStatusHasAlert(value: InjuryStatus): boolean {
  return value === "CURRENT" || value === "REHAB";
}

// Client lifecycle -----------------------------------------------------------
export const lifecycleStatusLabels = [
  "Active",
  "Pending",
  "Trial",
  "Paused",
  "Inactive",
  "Did not continue",
] as const;

export type LifecycleStatusLabel = (typeof lifecycleStatusLabels)[number];

const lifecycleToLabel: Record<ClientLifecycleStatus, LifecycleStatusLabel> = {
  ACTIVE: "Active",
  PENDING: "Pending",
  TRIAL: "Trial",
  PAUSED: "Paused",
  INACTIVE: "Inactive",
  DID_NOT_CONTINUE: "Did not continue",
};

const labelToLifecycle: Record<LifecycleStatusLabel, ClientLifecycleStatus> = {
  Active: "ACTIVE",
  Pending: "PENDING",
  Trial: "TRIAL",
  Paused: "PAUSED",
  Inactive: "INACTIVE",
  "Did not continue": "DID_NOT_CONTINUE",
};

export function lifecycleStatusLabelFor(
  value: ClientLifecycleStatus
): LifecycleStatusLabel {
  return lifecycleToLabel[value] ?? "Pending";
}

export function lifecycleStatusFromLabel(label: string): ClientLifecycleStatus {
  return labelToLifecycle[label as LifecycleStatusLabel] ?? "PENDING";
}

// Trial outcome --------------------------------------------------------------
// "Not recorded" is the UI-only label for a client with no trial outcome yet.
export const trialOutcomeLabels = [
  "Not recorded",
  "Subscribed",
  "Follow up later",
  "Did not continue",
  "No response",
  "No-show",
  "Needs different option",
] as const;

export type TrialOutcomeLabel = (typeof trialOutcomeLabels)[number];

const trialOutcomeToLabel: Record<TrialOutcome, TrialOutcomeLabel> = {
  SUBSCRIBED: "Subscribed",
  FOLLOW_UP: "Follow up later",
  DID_NOT_CONTINUE: "Did not continue",
  NO_RESPONSE: "No response",
  NO_SHOW: "No-show",
  NEEDS_DIFFERENT_OPTION: "Needs different option",
};

const labelToTrialOutcome: Record<
  Exclude<TrialOutcomeLabel, "Not recorded">,
  TrialOutcome
> = {
  Subscribed: "SUBSCRIBED",
  "Follow up later": "FOLLOW_UP",
  "Did not continue": "DID_NOT_CONTINUE",
  "No response": "NO_RESPONSE",
  "No-show": "NO_SHOW",
  "Needs different option": "NEEDS_DIFFERENT_OPTION",
};

export function trialOutcomeLabelFor(
  value: TrialOutcome | null
): TrialOutcomeLabel {
  return value ? trialOutcomeToLabel[value] ?? "Not recorded" : "Not recorded";
}

// Returns the enum value, or null for "Not recorded" / unknown labels.
export function trialOutcomeFromLabel(label: string): TrialOutcome | null {
  if (label === "Not recorded" || label === "") {
    return null;
  }
  return labelToTrialOutcome[label as Exclude<TrialOutcomeLabel, "Not recorded">] ?? null;
}
