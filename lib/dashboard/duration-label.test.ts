import { describe, expect, it } from "vitest";

import { parseDurationMinutes } from "@/lib/dashboard/duration-label";

describe("parseDurationMinutes", () => {
  it("parses minute labels", () => {
    expect(parseDurationMinutes("60 minutes")).toBe(60);
    expect(parseDurationMinutes("15 minutes")).toBe(15);
    expect(parseDurationMinutes("1 minute")).toBe(1);
  });

  it("parses hour labels", () => {
    expect(parseDurationMinutes("6 hours")).toBe(360);
    expect(parseDurationMinutes("1 hour")).toBe(60);
  });

  it("returns null for unrecognized labels", () => {
    expect(parseDurationMinutes("")).toBeNull();
    expect(parseDurationMinutes("soon")).toBeNull();
    expect(parseDurationMinutes("-5 minutes")).toBeNull();
  });
});
