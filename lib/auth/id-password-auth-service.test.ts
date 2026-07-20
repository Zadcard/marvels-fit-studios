import { describe, it, expect, beforeEach, vi } from "vitest";
import { IdPasswordAuthService } from "@/lib/auth/id-password-auth-service";
import * as bcryptjs from "bcryptjs";

vi.mock("bcryptjs");

describe("IdPasswordAuthService", () => {
  let service: IdPasswordAuthService;
  let mockDataStore: any;

  beforeEach(() => {
    mockDataStore = {
      user: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    };

    vi.mocked(bcryptjs.hash).mockResolvedValue("hashed_password" as never);

    service = new IdPasswordAuthService({
      findPassword: (userId) =>
        mockDataStore.user.findUnique({ where: { id: userId }, select: { password: true } }),
      updateUser: (userId, data) =>
        mockDataStore.user.update({ where: { id: userId }, data }),
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
