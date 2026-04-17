import { describe, expect, it } from "vitest";

import {
  changePasswordSchema,
  clientIdLoginSchema,
  clientIdSchema,
  clientRegistrationSchema,
  emailLoginSchema,
  emailSchema,
  fullNameSchema,
  loginSchema,
  normalizePhoneNumber,
  passwordResetRequestSchema,
  passwordResetSchema,
  passwordSchema,
  phoneSchema,
} from "@/lib/validators/id-auth";

describe("ID-based authentication validators", () => {
  it("validates 7-digit client IDs", () => {
    expect(clientIdSchema.parse(" 2605020 ")).toBe("2605020");
    expect(clientIdSchema.safeParse("260502").success).toBe(false);
    expect(clientIdSchema.safeParse("2605ABC").success).toBe(false);
  });

  it("validates strong passwords", () => {
    expect(passwordSchema.safeParse("Password123").success).toBe(true);
    expect(passwordSchema.safeParse("Password").success).toBe(false);
    expect(passwordSchema.safeParse("12345678").success).toBe(false);
  });

  it("normalizes Egyptian mobile phone numbers", () => {
    expect(normalizePhoneNumber("010 1234 5678")).toBe("+201012345678");
    expect(normalizePhoneNumber("1012345678")).toBe("+201012345678");
    expect(normalizePhoneNumber("+20 10 1234 5678")).toBe("+201012345678");
  });

  it("validates phone and name fields", () => {
    expect(phoneSchema.parse("01012345678")).toBe("+201012345678");
    expect(phoneSchema.safeParse("1234567").success).toBe(false);
    expect(fullNameSchema.parse(" John Doe ")).toBe("John Doe");
    expect(fullNameSchema.safeParse("J").success).toBe(false);
  });

  it("keeps email validators for legacy email login", () => {
    expect(emailSchema.safeParse("john@example.com").success).toBe(true);
    expect(emailSchema.safeParse("").success).toBe(true);
    expect(emailLoginSchema.safeParse({
      email: "john@example.com",
      password: "Password123",
    }).success).toBe(true);
  });

  it("validates client ID login schema", () => {
    expect(
      clientIdLoginSchema.safeParse({
        clientId: "2605020",
        password: "MFS_2605020",
      }).success
    ).toBe(true);
    expect(
      loginSchema.safeParse({ clientId: "abc", password: "password" }).success
    ).toBe(false);
  });

  it("validates client registration without email", () => {
    const result = clientRegistrationSchema.parse({
      fullName: "John Doe",
      phone: "01012345678",
    });

    expect(result).toEqual({
      fullName: "John Doe",
      phone: "+201012345678",
    });
  });

  it("does not include email in the registration contract", () => {
    const result = clientRegistrationSchema.parse({
      fullName: "John Doe",
      phone: "01012345678",
      email: "john@example.com",
    });

    expect(result).not.toHaveProperty("email");
  });

  it("validates password reset request and reset passwords", () => {
    expect(
      passwordResetRequestSchema.safeParse({ clientId: "2605020" }).success
    ).toBe(true);
    expect(
      passwordResetSchema.safeParse({
        token: "0123456789abcdef",
        newPassword: "Password123",
        confirmPassword: "Password124",
      }).success
    ).toBe(false);
  });

  it("rejects unchanged password in change password schema", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "Password123",
      newPassword: "Password123",
      confirmPassword: "Password123",
    });

    expect(result.success).toBe(false);
  });
});
