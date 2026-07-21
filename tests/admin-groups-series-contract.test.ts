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

  it("keeps every group mutation behind category-scoped write access", () => {
    expect(actions.match(/requireCategoryWriteAccess/g)?.length).toBeGreaterThanOrEqual(5);
  });
});
