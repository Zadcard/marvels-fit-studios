import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const promotionService = readFileSync(
  resolve("lib/leads/promote-leads-to-clients.ts"),
  "utf8",
);
const leadActions = readFileSync(resolve("app/actions/admin-leads.ts"), "utf8");
const migration = readFileSync(
  resolve("supabase/migrations/20260718173000_enforce_lead_trial_stage_integrity.sql"),
  "utf8",
);

describe("lead workflow integrity contract", () => {
  it("filters every promotion to completed, group-assigned trials", () => {
    expect(promotionService).toMatch(/DEFAULT_INCLUDE_STATUSES[\s\S]*LeadStatus\.TRIAL_DONE/);
    expect(promotionService).toMatch(/\.in\("status", includeStatuses\)/);
    expect(promotionService).toMatch(/\.not\("trialGroupId", "is", null\)/);
    expect(leadActions).toMatch(/summary\.examined !== 1/);
  });

  it("promotes trials without issuing client login credentials", () => {
    expect(promotionService).not.toContain("temporaryPassword");
    expect(promotionService).not.toContain("bcryptjs");
    expect(promotionService).not.toContain("clientId");
  });

  it("enforces the group requirement in both the action and database", () => {
    expect(leadActions).toMatch(
      /completeLeadTrial[\s\S]*\.not\("trialGroupId", "is", null\)/,
    );
    expect(migration).toContain('constraint "Lead_trial_group_stage_check"');
    expect(migration).toMatch(/"status" not in \('CONTACTED', 'TRIAL_DONE'\)/);
  });
});
