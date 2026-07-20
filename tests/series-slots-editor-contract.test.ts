import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const editor = readFileSync("components/dashboard/series-slots-editor.tsx", "utf8");

describe("series slots editor", () => {
  it("caps slots at 7 and never allows removing the last one", () => {
    expect(editor).toContain("slots.length >= 7");
    expect(editor).toContain("disabled={slots.length <= 1}");
  });

  it("is exported for reuse in both the group form and the schedule manager", () => {
    expect(editor).toContain("export function SeriesSlotsEditor");
  });
});
