import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("AccountSecurityPanel source", () => {
  it("renders the expected change password controls", () => {
    const source = readFileSync(
      "components/dashboard/account-security-panel.tsx",
      "utf8"
    );

    expect(source).toContain("Change password");
    expect(source).toContain("Current password");
    expect(source).toContain("New password");
    expect(source).toContain("Confirm new password");
    expect(source).toContain("Update password");
  });
});
