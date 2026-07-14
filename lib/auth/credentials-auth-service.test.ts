import { describe, expect, it, vi } from "vitest";

import { CredentialsAuthService } from "@/lib/auth/credentials-auth-service";
import type { PasswordVerifier } from "@/lib/auth/password-verifier";
import type { UserRepository } from "@/lib/auth/user-repository";

function createService(overrides?: {
  repository?: Partial<UserRepository>;
  passwordMatches?: boolean;
}) {
  const userRepository: UserRepository = {
    findByEmail: vi.fn().mockResolvedValue(null),
    findByClientId: vi.fn().mockResolvedValue(null),
    findById: vi.fn().mockResolvedValue(null),
    ...overrides?.repository,
  };
  const passwordVerifier: PasswordVerifier = {
    verify: vi.fn().mockResolvedValue(overrides?.passwordMatches ?? false),
  };

  return {
    service: new CredentialsAuthService(userRepository, passwordVerifier),
    userRepository,
    passwordVerifier,
  };
}

describe("CredentialsAuthService", () => {
  it("authenticates a persisted user with a matching password", async () => {
    const { service } = createService({
      repository: {
        findByEmail: vi.fn().mockResolvedValue({
          id: "admin-1",
          email: "admin@example.com",
          clientId: null,
          name: "Studio Admin",
          password: "hashed-password",
          mustChangePassword: false,
          role: "ADMIN",
        }),
      },
      passwordMatches: true,
    });

    await expect(
      service.authorize({
        email: "ADMIN@example.com",
        password: "Password123",
      })
    ).resolves.toEqual({
      id: "admin-1",
      email: "admin@example.com",
      name: "Studio Admin",
      role: "ADMIN",
      mustChangePassword: false,
    });
  });

  it("does not authenticate a missing user", async () => {
    const { service, passwordVerifier } = createService();

    await expect(
      service.authorize({
        email: "admin@test.com",
        password: "password123",
      })
    ).resolves.toBeNull();
    expect(passwordVerifier.verify).not.toHaveBeenCalled();
  });

  it("propagates repository failures instead of using fallback credentials", async () => {
    const databaseError = new Error("database unavailable");
    const { service } = createService({
      repository: {
        findByEmail: vi.fn().mockRejectedValue(databaseError),
      },
    });

    await expect(
      service.authorize({
        email: "admin@test.com",
        password: "password123",
      })
    ).rejects.toBe(databaseError);
  });
});
