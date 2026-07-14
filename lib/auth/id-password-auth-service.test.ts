import { describe, it, expect, beforeEach, vi } from "vitest";
import { IdPasswordAuthService } from "@/lib/auth/id-password-auth-service";
import * as bcryptjs from "bcryptjs";

vi.mock("bcryptjs");

describe("IdPasswordAuthService", () => {
  const userSelect = {
    id: true, name: true, clientId: true, email: true, password: true,
    mustChangePassword: true, role: true,
    clientProfile: { select: { fullName: true } },
  } as const;
  let service: IdPasswordAuthService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      client: {
        findFirst: vi.fn(),
      },
    };

    vi.mocked(bcryptjs.hash).mockResolvedValue("hashed_password" as never);

    service = new IdPasswordAuthService({
      findByClientId: (clientId) =>
        mockPrisma.user.findUnique({ where: { clientId }, select: userSelect }),
      findByPhones: async (phones) => {
        const result = await mockPrisma.client.findFirst({
          where: { phone: { in: phones } },
          select: { user: { select: userSelect } },
        });
        return result?.user ?? null;
      },
      findResetToken: (token, now) =>
        mockPrisma.user.findFirst({
          where: { passwordResetToken: token, passwordResetExpires: { gt: now } },
          select: { id: true },
        }),
      findPassword: (userId) =>
        mockPrisma.user.findUnique({ where: { id: userId }, select: { password: true } }),
      findIdByClientId: (clientId) =>
        mockPrisma.user.findUnique({ where: { clientId }, select: { id: true } }),
      updateUser: (userId, data) =>
        mockPrisma.user.update({ where: { id: userId }, data }),
    });
  });

  describe("authenticate", () => {
    it("should authenticate user with valid credentials", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-123",
        clientId: "2605020",
        email: null,
        name: "Client User",
        password: "hashed_password",
        mustChangePassword: false,
        role: "CLIENT",
        clientProfile: {
          fullName: "Client User",
        },
      });

      const passwordVerifier = (service as any).passwordVerifier;
      vi.spyOn(passwordVerifier, "verify").mockResolvedValue(true);

      const result = await service.authenticate({
        clientId: "2605020",
        password: "MFS_2605020",
      });

      expect(result).toEqual({
        userId: "user-123",
        clientId: "2605020",
        name: "Client User",
        email: null,
        mustChangePassword: false,
        role: "CLIENT",
      });
    });

    it("should authenticate user by phone number when client ID is not found", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.client.findFirst.mockResolvedValue({
        user: {
          id: "user-123",
          clientId: "2605020",
          email: null,
          name: "Client User",
          password: "hashed_password",
          mustChangePassword: false,
          role: "CLIENT",
          clientProfile: {
            fullName: "Client User",
          },
        },
      });

      const passwordVerifier = (service as any).passwordVerifier;
      vi.spyOn(passwordVerifier, "verify").mockResolvedValue(true);

      const result = await service.authenticate({
        clientId: "01080481525",
        password: "MFS_2605020",
      });

      expect(mockPrisma.client.findFirst).toHaveBeenCalledWith({
        where: {
          phone: {
            in: ["01080481525", "+201080481525"],
          },
        },
        select: {
          user: {
            select: expect.any(Object),
          },
        },
      });
      expect(result.clientId).toBe("2605020");
    });

    it("should update lastLoginAt on successful authentication", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-123",
        clientId: "2605020",
        password: "hashed_password",
        role: "CLIENT",
      });

      const passwordVerifier = (service as any).passwordVerifier;
      vi.spyOn(passwordVerifier, "verify").mockResolvedValue(true);

      await service.authenticate({
        clientId: "2605020",
        password: "MFS_2605020",
      });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-123" },
        data: { lastLoginAt: expect.any(Date) },
      });
    });

    it("should throw error when user not found", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.authenticate({
          clientId: "invalid",
          password: "password",
        })
      ).rejects.toThrow("Invalid client ID, phone, or password");
    });

    it("should throw error when user has no password", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-123",
        clientId: "2605020",
        password: null,
        role: "CLIENT",
      });

      await expect(
        service.authenticate({
          clientId: "2605020",
          password: "MFS_2605020",
        })
      ).rejects.toThrow("Invalid client ID, phone, or password");
    });

    it("should throw error when password is incorrect", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-123",
        clientId: "2605020",
        password: "hashed_password",
        role: "CLIENT",
      });

      const passwordVerifier = (service as any).passwordVerifier;
      vi.spyOn(passwordVerifier, "verify").mockResolvedValue(false);

      await expect(
        service.authenticate({
          clientId: "2605020",
          password: "wrong_password",
        })
      ).rejects.toThrow("Invalid client ID, phone, or password");
    });

    it("should query by clientId", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-123",
        clientId: "2605020",
        password: "hashed_password",
        role: "CLIENT",
      });

      const passwordVerifier = (service as any).passwordVerifier;
      vi.spyOn(passwordVerifier, "verify").mockResolvedValue(true);

      await service.authenticate({
        clientId: "2605020",
        password: "MFS_2605020",
      });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { clientId: "2605020" },
        select: {
          id: true,
          clientId: true,
          email: true,
          name: true,
          password: true,
          mustChangePassword: true,
          role: true,
          clientProfile: {
            select: {
              fullName: true,
            },
          },
        },
      });
    });

    it("should handle different user roles", async () => {
      const roles = ["CLIENT", "COACH", "ADMIN"];

      for (const role of roles) {
        mockPrisma.user.findUnique.mockResolvedValue({
          id: "user-123",
          clientId: "2605020",
          password: "hashed_password",
          role,
        });

        const passwordVerifier = (service as any).passwordVerifier;
        vi.spyOn(passwordVerifier, "verify").mockResolvedValue(true);

        const result = await service.authenticate({
          clientId: "2605020",
          password: "MFS_2605020",
        });

        expect(result.role).toBe(role);
      }
    });
  });

  describe("requestPasswordReset", () => {
    it("should create reset token for valid user", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-123",
      });

      await service.requestPasswordReset("2605020");

      const updateCall = mockPrisma.user.update.mock.calls[0][0];
      expect(updateCall.data).toHaveProperty("passwordResetToken");
      expect(updateCall.data).toHaveProperty("passwordResetExpires");
    });

    it("should set reset token expiry to 24 hours", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-123",
      });

      const before = Date.now();
      await service.requestPasswordReset("2605020");
      const after = Date.now();

      const updateCall = mockPrisma.user.update.mock.calls[0][0];
      const expiresTime = updateCall.data.passwordResetExpires.getTime();

      expect(expiresTime).toBeGreaterThanOrEqual(before + 24 * 60 * 60 * 1000);
      expect(expiresTime).toBeLessThanOrEqual(after + 24 * 60 * 60 * 1000 + 1000);
    });

    it("should generate 64-character hex token", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-123",
      });

      await service.requestPasswordReset("2605020");

      const updateCall = mockPrisma.user.update.mock.calls[0][0];
      const token = updateCall.data.passwordResetToken;

      expect(token).toMatch(/^[a-f0-9]{64}$/);
    });

    it("should not throw error if user not found", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.requestPasswordReset("invalid")
      ).resolves.not.toThrow();
    });

    it("should not update if user not found", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await service.requestPasswordReset("invalid");

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it("should query by clientId", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-123",
      });

      await service.requestPasswordReset("2605020");

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { clientId: "2605020" },
        select: { id: true },
      });
    });
  });

  describe("resetPassword", () => {
    it("should reset password with valid token", async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: "user-123",
      });

      await service.resetPassword("valid-token", "new_password");

      expect(bcryptjs.hash).toHaveBeenCalledWith("new_password", 10);
    });

    it("should clear reset token after successful reset", async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: "user-123",
      });

      await service.resetPassword("valid-token", "new_password");

      const updateCall = mockPrisma.user.update.mock.calls[0][0];
      expect(updateCall.data).toEqual({
        password: "hashed_password",
        passwordResetToken: null,
        passwordResetExpires: null,
      });
    });

    it("should throw error for invalid token", async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.resetPassword("invalid-token", "new_password")
      ).rejects.toThrow("Invalid or expired reset token");
    });

    it("should throw error for expired token", async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.resetPassword("expired-token", "new_password")
      ).rejects.toThrow("Invalid or expired reset token");
    });

    it("should find user by non-expired reset token", async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: "user-123",
      });

      await service.resetPassword("valid-token", "new_password");

      const findFirstCall = mockPrisma.user.findFirst.mock.calls[0][0];
      expect(findFirstCall.where).toEqual({
        passwordResetToken: "valid-token",
        passwordResetExpires: { gt: expect.any(Date) },
      });
    });

    it("should hash new password", async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: "user-123",
      });

      await service.resetPassword("valid-token", "new_password");

      expect(bcryptjs.hash).toHaveBeenCalledWith("new_password", 10);
    });
  });

  describe("changePassword", () => {
    it("should change password when current password is correct", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-123",
        password: "hashed_current_password",
      });

      const passwordVerifier = (service as any).passwordVerifier;
      vi.spyOn(passwordVerifier, "verify").mockResolvedValue(true);

      await service.changePassword(
        "user-123",
        "current_password",
        "new_password"
      );

      expect(bcryptjs.hash).toHaveBeenCalledWith("new_password", 10);
    });

    it("should update user password", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-123",
        password: "hashed_current_password",
      });

      const passwordVerifier = (service as any).passwordVerifier;
      vi.spyOn(passwordVerifier, "verify").mockResolvedValue(true);

      await service.changePassword(
        "user-123",
        "current_password",
        "new_password"
      );

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-123" },
        data: { password: "hashed_password", mustChangePassword: false },
      });
    });

    it("should throw error when user not found", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.changePassword("invalid", "current", "new")
      ).rejects.toThrow("User not found");
    });

    it("should throw error when user has no password", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-123",
        password: null,
      });

      await expect(
        service.changePassword("user-123", "current", "new")
      ).rejects.toThrow("User not found");
    });

    it("should throw error when current password is incorrect", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-123",
        password: "hashed_current_password",
      });

      const passwordVerifier = (service as any).passwordVerifier;
      vi.spyOn(passwordVerifier, "verify").mockResolvedValue(false);

      await expect(
        service.changePassword("user-123", "wrong_password", "new_password")
      ).rejects.toThrow("Current password is incorrect");
    });

    it("should not update password if verification fails", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-123",
        password: "hashed_current_password",
      });

      const passwordVerifier = (service as any).passwordVerifier;
      vi.spyOn(passwordVerifier, "verify").mockResolvedValue(false);

      try {
        await service.changePassword("user-123", "wrong", "new");
      } catch {
        // Expected error
      }

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it("should verify current password before changing", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-123",
        password: "hashed_current_password",
      });

      const passwordVerifier = (service as any).passwordVerifier;
      const verifySpy = vi.spyOn(passwordVerifier, "verify");
      verifySpy.mockResolvedValue(true);

      await service.changePassword("user-123", "current", "new");

      expect(verifySpy).toHaveBeenCalledWith(
        "current",
        "hashed_current_password"
      );
    });

    it("should hash new password with correct rounds", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-123",
        password: "hashed_current_password",
      });

      const passwordVerifier = (service as any).passwordVerifier;
      vi.spyOn(passwordVerifier, "verify").mockResolvedValue(true);

      await service.changePassword("user-123", "current", "new");

      const hashCall = vi.mocked(bcryptjs.hash).mock.calls[0];
      expect(hashCall[1]).toBe(10);
    });
  });

  describe("authentication flow with password reset", () => {
    it("should allow authentication after password reset", async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: "user-123",
      });

      await service.resetPassword("valid-token", "new_password");

      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-123",
        clientId: "2605020",
        password: "hashed_new_password",
        role: "CLIENT",
      });

      const passwordVerifier = (service as any).passwordVerifier;
      vi.spyOn(passwordVerifier, "verify").mockResolvedValue(true);

      const result = await service.authenticate({
        clientId: "2605020",
        password: "new_password",
      });

      expect(result.userId).toBe("user-123");
    });

    it("should clear reset token on successful reset", async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: "user-123",
      });

      await service.resetPassword("valid-token", "new_password");

      const updateCall = mockPrisma.user.update.mock.calls[0][0];
      expect(updateCall.data.passwordResetToken).toBeNull();
      expect(updateCall.data.passwordResetExpires).toBeNull();
    });
  });
});
