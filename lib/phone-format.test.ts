import { describe, expect, it } from "vitest";

import { formatPhoneNumber } from "./phone-format";

describe("formatPhoneNumber", () => {
  it.each([
    "01004421180",
    "+201004421180",
    "20 100 442 1180",
    "00201004421180",
    "1004421180",
  ])("formats %s with the Egyptian studio pattern", (phone) => {
    expect(formatPhoneNumber(phone)).toBe("+20 100 442 1180");
  });

  it("uses a consistent plus-prefixed grouping for other international numbers", () => {
    expect(formatPhoneNumber("+44 1234 567890")).toBe("+44 123 456 7890");
  });

  it("keeps explanatory copy and provides a fallback for empty values", () => {
    expect(formatPhoneNumber("No phone recorded")).toBe("No phone recorded");
    expect(formatPhoneNumber(null)).toBe("—");
    expect(formatPhoneNumber("", "Not recorded")).toBe("Not recorded");
  });
});
