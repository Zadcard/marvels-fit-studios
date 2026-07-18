import { describe, expect, it } from "vitest";
import { datesInRange, resolveReportRange } from "./report-range";

describe("report range", () => {
  it("uses Cairo day boundaries and an inclusive displayed range", () => {
    const range = resolveReportRange(
      { from: "2026-07-01", to: "2026-07-03" },
      "Africa/Cairo",
      new Date("2026-07-18T12:00:00Z"),
    );
    expect(range.startIso).toBe("2026-06-30T21:00:00.000Z");
    expect(range.endExclusiveIso).toBe("2026-07-03T21:00:00.000Z");
    expect(datesInRange(range.from, range.to)).toEqual([
      "2026-07-01", "2026-07-02", "2026-07-03",
    ]);
  });

  it("falls back to 30 days for invalid or oversized input", () => {
    const range = resolveReportRange(
      { from: "2020-01-01", to: "2026-07-18" },
      "Africa/Cairo",
      new Date("2026-07-18T12:00:00Z"),
    );
    expect(range.from).toBe("2026-06-19");
    expect(range.to).toBe("2026-07-18");
  });
});
