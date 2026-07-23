import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const actions = readFileSync("app/actions/admin-groups.ts", "utf8");

describe("admin groups series integration", () => {
  it("saves the group and its series in one action", () => {
    expect(actions).toContain("save_admin_group");
    expect(actions).toContain('rpc("sync_recurring_session_template"');
    expect(actions).toContain("input.series");
  });

  it("skips the series sync when no schedule was provided", () => {
    expect(actions).toMatch(/if \(series\)/);
  });

  it("keeps every group mutation behind category- or group-scoped write access", () => {
    // requireGroupWriteAccess additionally allows a group's assigned coach
    // to edit it (never its schedule) without requiring category supervision.
    const guardCalls = actions.match(/requireCategoryWriteAccess|requireGroupWriteAccess/g)?.length ?? 0;
    expect(guardCalls).toBeGreaterThanOrEqual(5);
  });

  it("never lets a plain group-owner coach touch the recurring schedule", () => {
    expect(actions).toMatch(/if \(series && !access\.canEditTimes\)/);
  });
});
