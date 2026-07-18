import { describe, expect, it } from "vitest";
import {
  addStudioDays,
  getStudioDateKey,
  getStudioDayRange,
  instantToStudioDateTimeLocal,
  studioDateTimeLocalToIso,
} from "@/lib/time/studio-time";

describe("studio time", () => {
  it("uses Cairo civil dates independent of the runtime timezone", () => {
    expect(getStudioDateKey(new Date("2026-07-17T22:30:00.000Z"))).toBe(
      "2026-07-18",
    );
    expect(addStudioDays("2026-07-31", 1)).toBe("2026-08-01");
  });

  it("converts Cairo local inputs with the correct seasonal offset", () => {
    expect(studioDateTimeLocalToIso("2026-07-18T18:30")).toBe(
      "2026-07-18T15:30:00.000Z",
    );
    expect(studioDateTimeLocalToIso("2026-01-18T18:30")).toBe(
      "2026-01-18T16:30:00.000Z",
    );
    expect(instantToStudioDateTimeLocal("2026-07-18T15:30:00.000Z")).toBe(
      "2026-07-18T18:30",
    );
  });

  it("builds Cairo day boundaries as UTC instants", () => {
    expect(getStudioDayRange("2026-07-18")).toEqual({
      start: "2026-07-17T21:00:00.000Z",
      endExclusive: "2026-07-18T21:00:00.000Z",
    });
  });
});
