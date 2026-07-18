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
  let mockDataStore: any;

  beforeEach(() => {
    mockDataStore = {
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
        mockDataStore.user.findUnique({ where: { clientId }, select: userSelect }),
      findByPhones: async (phones) => {
        const result = await mockDataStore.client.findFirst({
          where: { phone: { in: phones } },
          select: { user: { select: userSelect } },
        });
        return result?.user ?? null;
      },
      findPassword: (userId) =>
        mockDataStore.user.findUnique({ where: { id: userId }, select: { password: true } }),
      updateUser: (userId, data) =>
        mockDataStore.user.update({ where: { id: userId }, data }),
    });
  });

  describe("authenticate", () => {
    it("should authenticate user with valid credentials", async () => {
      mockDataStore.user.findUnique.mockResolvedValue({
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
      mockDataStore.user.findUnique.mockResolvedValue(null);
      mockDataStore.client.findFirst.mockResolvedValue({
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

      expect(mockDataStore.client.findFirst).toHaveBeenCalledWith({
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
      mockDataStore.user.findUnique.mockResolvedValue({
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

      expect(mockDataStore.user.update).toHaveBeenCalledWith({
        where: { id: "user-123" },
        data: { lastLoginAt: expect.any(Date) },
      });
    });

    it("should throw error when user not found", async () => {
      mockDataStore.user.findUnique.mockResolvedValue(null);

      await expect(
        service.authenticate({
          clientId: "invalid",
          password: "password",
        })
      ).rejects.toThrow("Invalid client ID, phone, or password");
    });

    it("should throw error when user has no password", async () => {
      mockDataStore.user.findUnique.mockResolvedValue({
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
      mockDataStore.user.findUnique.mockResolvedValue({
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
      mockDataStore.user.findUnique.mockResolvedValue({
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

      expect(mockDataStore.user.findUnique).toHaveBeenCalledWith({
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
        mockDataStore.user.findUnique.mockResolvedValue({
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

  describe("changePassword", () => {
    it("should change password when current password is correct", async () => {
      mockDataStore.user.findUnique.mockResolvedValue({
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
      mockDataStore.user.findUnique.mockResolvedValue({
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

      expect(mockDataStore.user.update).toHaveBeenCalledWith({
        where: { id: "user-123" },
        data: { password: "hashed_password", mustChangePassword: false },
      });
    });

    it("should throw error when user not found", async () => {
      mockDataStore.user.findUnique.mockResolvedValue(null);

      await expect(
        service.changePassword("invalid", "current", "new")
      ).rejects.toThrow("User not found");
    });

    it("should throw error when user has no password", async () => {
      mockDataStore.user.findUnique.mockResolvedValue({
        id: "user-123",
        password: null,
      });

      await expect(
        service.changePassword("user-123", "current", "new")
      ).rejects.toThrow("User not found");
    });

    it("should throw error when current password is incorrect", async () => {
      mockDataStore.user.findUnique.mockResolvedValue({
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
      mockDataStore.user.findUnique.mockResolvedValue({
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

      expect(mockDataStore.user.update).not.toHaveBeenCalled();
    });

    it("should verify current password before changing", async () => {
      mockDataStore.user.findUnique.mockResolvedValue({
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
      mockDataStore.user.findUnique.mockResolvedValue({
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

});
