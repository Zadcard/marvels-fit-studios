import { describe, expect, it } from "vitest";

import { normalizeLeadSource } from "@/lib/dashboard/lead-source";

describe("normalizeLeadSource", () => {
  it.each([
    ["whatsapp-form", "WhatsApp"],
    ["Instagram bio", "Instagram"],
    ["phone-call", "Phone"],
    ["walk-in", "Walk-in"],
    ["Facebook Messenger", "Messenger"],
    ["messenger dm", "Messenger"],

  ] as const)("maps %s to %s", (input, expected) => {
    expect(normalizeLeadSource(input)).toBe(expected);
  });

  it("does not mislabel an unknown source as WhatsApp", () => {
    expect(normalizeLeadSource("partner referral")).toBe("Other");
    expect(normalizeLeadSource("")).toBe("Other");
  });
});
