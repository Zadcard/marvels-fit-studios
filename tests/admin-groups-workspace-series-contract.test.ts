import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const workspace = readFileSync("components/dashboard/admin-groups-workspace.tsx", "utf8");

describe("admin groups workspace schedule section", () => {
  it("embeds the shared slots editor in the group form", () => {
    expect(workspace).toContain("SeriesSlotsEditor");
    expect(workspace).toContain("series:");
  });

  it("pre-fills the schedule when editing a group that already has one", () => {
    expect(workspace).toContain("record.series");
  });
});
