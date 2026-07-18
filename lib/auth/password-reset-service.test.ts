import { describe, expect, it, vi } from "vitest";

import {
  PasswordResetService,
  type PasswordResetStore,
} from "@/lib/auth/password-reset-service";

function createStore(overrides: Partial<PasswordResetStore> = {}) {
  return {
    resolveTargetUserId: vi.fn().mockResolvedValue("user-1"),
    issueGrant: vi.fn().mockResolvedValue(undefined),
    hasActiveGrant: vi.fn().mockResolvedValue(true),
    consumeGrant: vi.fn().mockResolvedValue(true),
    ...overrides,
  } satisfies PasswordResetStore;
}

describe("PasswordResetService", () => {
  it("issues a 30-minute link while storing only an opaque token hash", async () => {
    const store = createStore();
    const service = new PasswordResetService(store);
    const before = Date.now();

    const result = await service.issue(
      { profileId: "client-1", profileType: "client" },
      "admin-1",
    );

    const token = new URL(result.path, "https://studio.test").searchParams.get("token");
    const grant = vi.mocked(store.issueGrant).mock.calls[0]?.[0];

    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(grant).toMatchObject({
      createdById: "admin-1",
      userId: "user-1",
      tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
    });
    expect(grant?.tokenHash).not.toContain(token ?? "");
    expect(new Date(result.expiresAt).getTime()).toBeGreaterThanOrEqual(
      before + 30 * 60 * 1000,
    );
  });

  it("does not issue a grant for a missing profile", async () => {
    const store = createStore({ resolveTargetUserId: vi.fn().mockResolvedValue(null) });
    const service = new PasswordResetService(store);

    await expect(
      service.issue({ profileId: "missing", profileType: "coach" }, "admin-1"),
    ).rejects.toThrow("Account not found");
    expect(store.issueGrant).not.toHaveBeenCalled();
  });

  it("rejects malformed and inactive tokens before password hashing", async () => {
    const store = createStore({ hasActiveGrant: vi.fn().mockResolvedValue(false) });
    const service = new PasswordResetService(store);

    await expect(service.consume("not-a-token", "Strongpass1")).resolves.toBe(false);
    expect(store.hasActiveGrant).not.toHaveBeenCalled();

    const syntacticallyValidToken = "a".repeat(43);
    await expect(service.consume(syntacticallyValidToken, "Strongpass1")).resolves.toBe(false);
    expect(store.consumeGrant).not.toHaveBeenCalled();
  });

  it("hashes a new password with bcrypt cost 12 before atomic consumption", async () => {
    const store = createStore();
    const service = new PasswordResetService(store);

    await expect(service.consume("b".repeat(43), "Strongpass1")).resolves.toBe(true);

    const [tokenHash, passwordHash] = vi.mocked(store.consumeGrant).mock.calls[0];
    expect(tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(passwordHash).toMatch(/^\$2[aby]\$12\$/);
  });
});
