import { describe, expect, it } from "vitest";

import {
  getScheduleWeekStart,
  parseScheduleReference,
} from "@/lib/dashboard/schedule-week";

describe("configured schedule week", () => {
  it("starts the same reference week on the configured weekday", () => {
    const reference = "2026-07-18";
    expect(getScheduleWeekStart(reference, "Monday")).toBe("2026-07-13");
    expect(getScheduleWeekStart(reference, "Saturday")).toBe("2026-07-18");
    expect(getScheduleWeekStart(reference, "Sunday")).toBe("2026-07-12");
  });

  it("accepts only an explicit date key from the URL", () => {
    expect(parseScheduleReference("2026-07-20")).toBe("2026-07-20");
    expect(
      parseScheduleReference("not-a-date", new Date("2026-07-18T12:00:00Z")),
    ).toBe("2026-07-18");
  });
});
