import { describe, expect, it } from "vitest";

import {
  getScheduleWeekStart,
  parseScheduleReference,
} from "@/lib/dashboard/schedule-week";

describe("configured schedule week", () => {
  it("starts the same reference week on the configured weekday", () => {
    const reference = new Date("2026-07-18T12:00:00");
    expect(getScheduleWeekStart(reference, "Monday").getDay()).toBe(1);
    expect(getScheduleWeekStart(reference, "Saturday").getDay()).toBe(6);
    expect(getScheduleWeekStart(reference, "Sunday").getDay()).toBe(0);
  });

  it("accepts only an explicit date key from the URL", () => {
    expect(parseScheduleReference("2026-07-20").getDate()).toBe(20);
    expect(
      parseScheduleReference("not-a-date", new Date("2026-07-18T12:00:00")).getDate(),
    ).toBe(18);
  });
});
