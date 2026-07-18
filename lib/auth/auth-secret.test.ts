import { describe, expect, it } from "vitest";

import { requireAuthSecret, resolveAuthSecret } from "@/lib/auth/auth-secret";

describe("authentication secret resolution", () => {
  it("prefers an explicitly configured Auth.js secret", () => {
    expect(
      resolveAuthSecret({
        AUTH_SECRET: "primary-secret",
        NEXTAUTH_SECRET: "legacy-secret",
        NODE_ENV: "production",
      }),
    ).toBe("primary-secret");
  });

  it("permits the known fallback only in an explicit local dev process", () => {
    expect(resolveAuthSecret({ NODE_ENV: "development" })).toBe(
      "dev-only-auth-secret-change-me",
    );
    expect(resolveAuthSecret({ NODE_ENV: "development", CI: "true" })).toBeUndefined();
    expect(resolveAuthSecret({ NODE_ENV: "development", VERCEL: "1" })).toBeUndefined();
    expect(resolveAuthSecret({ NODE_ENV: "test" })).toBeUndefined();
    expect(resolveAuthSecret({ NODE_ENV: "production" })).toBeUndefined();
  });

  it("fails security hashing closed when a deployed environment has no secret", () => {
    expect(() => requireAuthSecret({ NODE_ENV: "production" })).toThrow(
      "Missing AUTH_SECRET",
    );
  });
});
