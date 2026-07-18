import { describe, expect, it } from "vitest";

import { generateTemporaryPassword } from "@/lib/auth/temporary-password";

describe("generateTemporaryPassword", () => {
  it("meets the delivered password policy", () => {
    const password = generateTemporaryPassword();

    expect(password.length).toBeGreaterThanOrEqual(20);
    expect(password).toMatch(/[A-Za-z]/);
    expect(password).toMatch(/[0-9]/);
    expect(password).toMatch(/^Mfs9-[A-Za-z0-9_-]+$/);
  });

  it("does not derive credentials from account identifiers", () => {
    const passwords = new Set(
      Array.from({ length: 100 }, () => generateTemporaryPassword()),
    );

    expect(passwords.size).toBe(100);
  });
});
