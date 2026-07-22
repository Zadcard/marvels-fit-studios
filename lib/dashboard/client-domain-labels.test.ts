import { describe, expect, it } from "vitest";

import {
  ClientLifecycleStatus,
  InjuryStatus,
  TrainingCategory,
  TrialOutcome,
} from "@/lib/supabase/domain";
import {
  injuryStatusFromLabel,
  injuryStatusHasAlert,
  injuryStatusLabelFor,
  injuryStatusLabels,
  lifecycleStatusFromLabel,
  lifecycleStatusLabelFor,
  lifecycleStatusLabels,
  trainingCategoryFromLabel,
  trainingCategoryLabelFor,
  trainingCategoryLabels,
  trialOutcomeFromLabel,
  trialOutcomeLabelFor,
} from "@/lib/dashboard/client-domain-labels";

describe("client domain labels", () => {
  it("round-trips every training category between enum and label", () => {
    for (const value of Object.values(TrainingCategory)) {
      const label = trainingCategoryLabelFor(value);
      expect(trainingCategoryLabels).toContain(label);
      expect(trainingCategoryFromLabel(label)).toBe(value);
    }
  });

  it("round-trips every injury status between enum and label", () => {
    for (const value of Object.values(InjuryStatus)) {
      const label = injuryStatusLabelFor(value);
      expect(injuryStatusLabels).toContain(label);
      expect(injuryStatusFromLabel(label)).toBe(value);
    }
  });

  it("falls back to safe defaults for unknown input", () => {
    expect(trainingCategoryFromLabel("Not a category")).toBe(
      TrainingCategory.GENERAL_FITNESS
    );
    expect(injuryStatusFromLabel("Not a status")).toBe(InjuryStatus.NONE);
  });

  it("round-trips every lifecycle status between enum and label", () => {
    for (const value of Object.values(ClientLifecycleStatus)) {
      const label = lifecycleStatusLabelFor(value);
      expect(lifecycleStatusLabels).toContain(label);
      expect(lifecycleStatusFromLabel(label)).toBe(value);
    }
  });

  it("round-trips every trial outcome and treats 'Not recorded' as null", () => {
    for (const value of Object.values(TrialOutcome)) {
      const label = trialOutcomeLabelFor(value);
      expect(trialOutcomeFromLabel(label)).toBe(value);
    }
    expect(trialOutcomeLabelFor(null)).toBe("Not recorded");
    expect(trialOutcomeFromLabel("Not recorded")).toBeNull();
    expect(trialOutcomeFromLabel("")).toBeNull();
  });

  it("raises an injury alert only for current injuries and rehab", () => {
    expect(injuryStatusHasAlert(InjuryStatus.CURRENT)).toBe(true);
    expect(injuryStatusHasAlert(InjuryStatus.REHAB)).toBe(true);
    expect(injuryStatusHasAlert(InjuryStatus.PREVIOUS)).toBe(true);
    expect(injuryStatusHasAlert(InjuryStatus.NONE)).toBe(false);
  });
});
