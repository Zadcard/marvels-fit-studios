import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  requireUser: vi.fn(),
}));

vi.mock("@/lib/auth/id-password-auth-service", () => ({
  idPasswordAuthService: {
    changePassword: vi.fn(),
  },
}));

describe("account security actions", () => {
  let requireUser: typeof import("@/lib/auth/session").requireUser;
  let idPasswordAuthService: typeof import("@/lib/auth/id-password-auth-service").idPasswordAuthService;
  let changeOwnPassword: typeof import("@/app/actions/account-security").changeOwnPassword;

  beforeEach(async () => {
    vi.clearAllMocks();
    requireUser = (await import("@/lib/auth/session")).requireUser;
    idPasswordAuthService = (await import("@/lib/auth/id-password-auth-service"))
      .idPasswordAuthService;
    changeOwnPassword = (await import("@/app/actions/account-security"))
      .changeOwnPassword;
    vi.mocked(requireUser).mockResolvedValue({
      id: "user-1",
      email: null,
      name: null,
      role: "CLIENT",
    });
  });

  it("uses ID password auth service for password changes", async () => {
    await changeOwnPassword({
      currentPassword: "Current123",
      newPassword: "Password123",
      confirmPassword: "Password123",
    });

    expect(idPasswordAuthService.changePassword).toHaveBeenCalledWith(
      "user-1",
      "Current123",
      "Password123"
    );
  });

  it("rejects invalid password input before service call", async () => {
    await expect(
      changeOwnPassword({
        currentPassword: "Current123",
        newPassword: "short",
        confirmPassword: "short",
      })
    ).rejects.toThrow("Password must be at least 8 characters");

    expect(idPasswordAuthService.changePassword).not.toHaveBeenCalled();
  });
});
