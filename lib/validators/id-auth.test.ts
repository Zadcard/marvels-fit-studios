import { describe, it, expect } from "vitest";
import {
  clientIdSchema,
  passwordSchema,
  phoneSchema,
  fullNameSchema,
  emailSchema,
  clientIdLoginSchema,
  emailLoginSchema,
  clientRegistrationSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  changePasswordSchema,
} from "@/lib/validators/id-auth";

describe("ID-based authentication validators", () => {
  describe("clientIdSchema", () => {
    it("should validate correct client ID format", () => {
      const result = clientIdSchema.safeParse("2605020");
      expect(result.success).toBe(true);
    });

    it("should trim whitespace", () => {
      const result = clientIdSchema.safeParse("  2605020  ");
      expect(result.success).toBe(true);
      expect(result.data).toBe("2605020");
    });

    it("should reject too short ID", () => {
      const result = clientIdSchema.safeParse("260502");
      expect(result.success).toBe(false);
    });

    it("should reject too long ID", () => {
      const result = clientIdSchema.safeParse("26050200");
      expect(result.success).toBe(false);
    });

    it("should reject non-numeric characters", () => {
      const result = clientIdSchema.safeParse("2605ABC");
      expect(result.success).toBe(false);
    });

    it("should accept all valid client number ranges", () => {
      expect(clientIdSchema.safeParse("2605001").success).toBe(true);
      expect(clientIdSchema.safeParse("2605500").success).toBe(true);
      expect(clientIdSchema.safeParse("2605999").success).toBe(true);
    });
  });

  describe("passwordSchema", () => {
    it("should validate correct password", () => {
      const result = passwordSchema.safeParse("Password123");
      expect(result.success).toBe(true);
    });

    it("should require at least 8 characters", () => {
      const result = passwordSchema.safeParse("Pass1");
      expect(result.success).toBe(false);
    });

    it("should require at least one letter", () => {
      const result = passwordSchema.safeParse("12345678");
      expect(result.success).toBe(false);
    });

    it("should require at least one number", () => {
      const result = passwordSchema.safeParse("Password");
      expect(result.success).toBe(false);
    });

    it("should accept uppercase letters", () => {
      const result = passwordSchema.safeParse("PASSWORD123");
      expect(result.success).toBe(true);
    });

    it("should accept lowercase letters", () => {
      const result = passwordSchema.safeParse("password123");
      expect(result.success).toBe(true);
    });

    it("should accept special characters", () => {
      const result = passwordSchema.safeParse("Pass@word123");
      expect(result.success).toBe(true);
    });
  });

  describe("phoneSchema", () => {
    it("should validate correct phone number", () => {
      const result = phoneSchema.safeParse("+1234567890");
      expect(result.success).toBe(true);
    });

    it("should trim whitespace", () => {
      const result = phoneSchema.safeParse("  +1234567890  ");
      expect(result.success).toBe(true);
      expect(result.data).toBe("+1234567890");
    });

    it("should require at least 8 characters", () => {
      const result = phoneSchema.safeParse("1234567");
      expect(result.success).toBe(false);
    });

    it("should accept different phone formats", () => {
      expect(phoneSchema.safeParse("+1234567890").success).toBe(true);
      expect(phoneSchema.safeParse("201012345678").success).toBe(true);
      expect(phoneSchema.safeParse("0101234567").success).toBe(true);
    });
  });

  describe("fullNameSchema", () => {
    it("should validate correct full name", () => {
      const result = fullNameSchema.safeParse("John Doe");
      expect(result.success).toBe(true);
    });

    it("should trim whitespace", () => {
      const result = fullNameSchema.safeParse("  John Doe  ");
      expect(result.success).toBe(true);
      expect(result.data).toBe("John Doe");
    });

    it("should require at least 2 characters", () => {
      const result = fullNameSchema.safeParse("J");
      expect(result.success).toBe(false);
    });

    it("should limit to 100 characters", () => {
      const longName = "A".repeat(101);
      const result = fullNameSchema.safeParse(longName);
      expect(result.success).toBe(false);
    });

    it("should accept special characters", () => {
      const result = fullNameSchema.safeParse("José María");
      expect(result.success).toBe(true);
    });

    it("should accept single names", () => {
      const result = fullNameSchema.safeParse("Madonna");
      expect(result.success).toBe(true);
    });
  });

  describe("emailSchema", () => {
    it("should validate correct email", () => {
      const result = emailSchema.safeParse("john@example.com");
      expect(result.success).toBe(true);
    });

    it("should be optional", () => {
      const result = emailSchema.safeParse("");
      expect(result.success).toBe(true);
      expect(result.data).toBe("");
    });

    it("should accept undefined", () => {
      const result = emailSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const result = emailSchema.safeParse("not-an-email");
      expect(result.success).toBe(false);
    });

    it("should trim whitespace", () => {
      const result = emailSchema.safeParse("  john@example.com  ");
      expect(result.success).toBe(true);
      expect(result.data).toBe("john@example.com");
    });
  });

  describe("clientIdLoginSchema", () => {
    it("should validate correct login", () => {
      const result = clientIdLoginSchema.safeParse({
        clientId: "2605020",
        password: "MyPassword123",
      });
      expect(result.success).toBe(true);
    });

    it("should require clientId", () => {
      const result = clientIdLoginSchema.safeParse({
        password: "MyPassword123",
      });
      expect(result.success).toBe(false);
    });

    it("should require password", () => {
      const result = clientIdLoginSchema.safeParse({
        clientId: "2605020",
      });
      expect(result.success).toBe(false);
    });

    it("should validate clientId format", () => {
      const result = clientIdLoginSchema.safeParse({
        clientId: "invalid",
        password: "MyPassword123",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("emailLoginSchema", () => {
    it("should validate correct login", () => {
      const result = emailLoginSchema.safeParse({
        email: "john@example.com",
        password: "MyPassword123",
      });
      expect(result.success).toBe(true);
    });

    it("should require email", () => {
      const result = emailLoginSchema.safeParse({
        password: "MyPassword123",
      });
      expect(result.success).toBe(false);
    });

    it("should require password", () => {
      const result = emailLoginSchema.safeParse({
        email: "john@example.com",
      });
      expect(result.success).toBe(false);
    });

    it("should validate email format", () => {
      const result = emailLoginSchema.safeParse({
        email: "not-an-email",
        password: "MyPassword123",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("clientRegistrationSchema", () => {
    it("should validate correct registration", () => {
      const result = clientRegistrationSchema.safeParse({
        fullName: "John Doe",
        phone: "+1234567890",
        email: "john@example.com",
      });
      expect(result.success).toBe(true);
    });

    it("should allow optional email", () => {
      const result = clientRegistrationSchema.safeParse({
        fullName: "John Doe",
        phone: "+1234567890",
      });
      expect(result.success).toBe(true);
    });

    it("should allow empty email string", () => {
      const result = clientRegistrationSchema.safeParse({
        fullName: "John Doe",
        phone: "+1234567890",
        email: "",
      });
      expect(result.success).toBe(true);
    });

    it("should require fullName", () => {
      const result = clientRegistrationSchema.safeParse({
        phone: "+1234567890",
      });
      expect(result.success).toBe(false);
    });

    it("should require phone", () => {
      const result = clientRegistrationSchema.safeParse({
        fullName: "John Doe",
      });
      expect(result.success).toBe(false);
    });

    it("should validate all fields", () => {
      const result = clientRegistrationSchema.safeParse({
        fullName: "J",
        phone: "123",
        email: "invalid",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("passwordResetRequestSchema", () => {
    it("should validate correct request", () => {
      const result = passwordResetRequestSchema.safeParse({
        clientId: "2605020",
      });
      expect(result.success).toBe(true);
    });

    it("should require clientId", () => {
      const result = passwordResetRequestSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("should validate clientId format", () => {
      const result = passwordResetRequestSchema.safeParse({
        clientId: "invalid",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("passwordResetSchema", () => {
    it("should validate correct reset", () => {
      const result = passwordResetSchema.safeParse({
        token: "valid-token-here",
        newPassword: "NewPassword123",
        confirmPassword: "NewPassword123",
      });
      expect(result.success).toBe(true);
    });

    it("should require token", () => {
      const result = passwordResetSchema.safeParse({
        newPassword: "NewPassword123",
        confirmPassword: "NewPassword123",
      });
      expect(result.success).toBe(false);
    });

    it("should require newPassword", () => {
      const result = passwordResetSchema.safeParse({
        token: "valid-token",
        confirmPassword: "NewPassword123",
      });
      expect(result.success).toBe(false);
    });

    it("should require confirmPassword", () => {
      const result = passwordResetSchema.safeParse({
        token: "valid-token",
        newPassword: "NewPassword123",
      });
      expect(result.success).toBe(false);
    });

    it("should validate password requirements", () => {
      const result = passwordResetSchema.safeParse({
        token: "valid-token",
        newPassword: "weak",
        confirmPassword: "weak",
      });
      expect(result.success).toBe(false);
    });

    it("should verify password match", () => {
      const result = passwordResetSchema.safeParse({
        token: "valid-token",
        newPassword: "NewPassword123",
        confirmPassword: "DifferentPassword123",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("changePasswordSchema", () => {
    it("should validate correct change", () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: "OldPassword123",
        newPassword: "NewPassword456",
        confirmPassword: "NewPassword456",
      });
      expect(result.success).toBe(true);
    });

    it("should require currentPassword", () => {
      const result = changePasswordSchema.safeParse({
        newPassword: "NewPassword456",
        confirmPassword: "NewPassword456",
      });
      expect(result.success).toBe(false);
    });

    it("should require newPassword", () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: "OldPassword123",
        confirmPassword: "NewPassword456",
      });
      expect(result.success).toBe(false);
    });

    it("should require confirmPassword", () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: "OldPassword123",
        newPassword: "NewPassword456",
      });
      expect(result.success).toBe(false);
    });

    it("should validate newPassword requirements", () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: "OldPassword123",
        newPassword: "weak",
        confirmPassword: "weak",
      });
      expect(result.success).toBe(false);
    });

    it("should verify passwords match", () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: "OldPassword123",
        newPassword: "NewPassword456",
        confirmPassword: "DifferentPassword456",
      });
      expect(result.success).toBe(false);
    });

    it("should prevent reusing current password", () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: "SamePassword123",
        newPassword: "SamePassword123",
        confirmPassword: "SamePassword123",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("validator cross-checking", () => {
    it("should accept typical client registration flow", () => {
      const login = clientIdLoginSchema.safeParse({
        clientId: "2605020",
        password: "MFS_2605020",
      });
      expect(login.success).toBe(true);
    });

    it("should handle typical password reset flow", () => {
      const request = passwordResetRequestSchema.safeParse({
        clientId: "2605020",
      });
      expect(request.success).toBe(true);

      const reset = passwordResetSchema.safeParse({
        token: "abcd1234efgh5678ijkl9012mnop3456",
        newPassword: "NewSecurePass123",
        confirmPassword: "NewSecurePass123",
      });
      expect(reset.success).toBe(true);
    });

    it("should handle typical change password flow", () => {
      const change = changePasswordSchema.safeParse({
        currentPassword: "OldPass123",
        newPassword: "NewSecurePass456",
        confirmPassword: "NewSecurePass456",
      });
      expect(change.success).toBe(true);
    });
  });
});
