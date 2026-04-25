import { describe, expect, it } from "vitest";

import { buildWhatsAppHref, normalizeWhatsAppPhone } from "@/lib/whatsapp";

describe("WhatsApp phone helpers", () => {
  it("normalizes Egyptian local mobile numbers", () => {
    expect(normalizeWhatsAppPhone("010 1234 5678")).toBe("201012345678");
  });

  it("keeps international numbers without formatting characters", () => {
    expect(normalizeWhatsAppPhone("+20 101 234 5678")).toBe("201012345678");
  });

  it("builds wa.me links only when a phone exists", () => {
    expect(buildWhatsAppHref("+20 101 234 5678")).toBe(
      "https://wa.me/201012345678"
    );
    expect(buildWhatsAppHref("No phone")).toBeNull();
  });
});
