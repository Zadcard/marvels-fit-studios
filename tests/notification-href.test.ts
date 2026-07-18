import { describe, expect, it } from "vitest";

import { getSafeNotificationHref } from "@/lib/navigation/notification-href";

describe("notification navigation", () => {
  it("allows only internal destinations for the current dashboard role", () => {
    expect(getSafeNotificationHref("/admin/clients?client=123", "admin")).toBe(
      "/admin/clients?client=123",
    );
    expect(getSafeNotificationHref("/coach/clients", "coach")).toBe(
      "/coach/clients",
    );
    expect(getSafeNotificationHref("/client/sessions", "admin")).toBeNull();
    expect(getSafeNotificationHref("/admin/clients", "coach")).toBeNull();
    expect(getSafeNotificationHref("//attacker.example", "admin")).toBeNull();
    expect(getSafeNotificationHref("https://attacker.example", "admin")).toBeNull();
  });
});
