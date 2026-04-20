import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/id-password-auth-service", () => ({
  idPasswordAuthService: {
    requestPasswordReset: vi.fn(),
    resetPassword: vi.fn(),
  },
}));

describe("password reset actions", () => {
  let service: typeof import("@/lib/auth/id-password-auth-service").idPasswordAuthService;
  let actions: typeof import("@/app/actions/password-reset");
  let state: typeof import("@/app/actions/password-reset-state");

  beforeEach(async () => {
    vi.clearAllMocks();
    service = (await import("@/lib/auth/id-password-auth-service"))
      .idPasswordAuthService;
    actions = await import("@/app/actions/password-reset");
    state = await import("@/app/actions/password-reset-state");
  });

  it("requests reset with generic success message", async () => {
    const formData = new FormData();
    formData.set("clientId", "2605020");

    const result = await actions.requestPasswordReset(
      state.initialPasswordResetState,
      formData
    );

    expect(service.requestPasswordReset).toHaveBeenCalledWith("2605020");
    expect(result).toMatchObject({
      status: "success",
      message: "If account exists, reset instructions sent.",
    });
  });

  it("validates Client ID before requesting reset", async () => {
    const formData = new FormData();
    formData.set("clientId", "bad");

    const result = await actions.requestPasswordReset(
      state.initialPasswordResetState,
      formData
    );

    expect(service.requestPasswordReset).not.toHaveBeenCalled();
    expect(result.status).toBe("error");
  });

  it("resets password with token", async () => {
    const formData = new FormData();
    formData.set("token", "0123456789abcdef");
    formData.set("newPassword", "Password123");
    formData.set("confirmPassword", "Password123");

    const result = await actions.resetPasswordWithToken(
      state.initialPasswordResetState,
      formData
    );

    expect(service.resetPassword).toHaveBeenCalledWith(
      "0123456789abcdef",
      "Password123"
    );
    expect(result.status).toBe("success");
  });
});
