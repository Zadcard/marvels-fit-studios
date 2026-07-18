import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/password-reset-service", () => ({
  passwordResetService: { consume: vi.fn() },
}));

import { passwordResetService } from "@/lib/auth/password-reset-service";
import { POST } from "./route";

function resetRequest(body: unknown) {
  return new Request("https://studio.test/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/reset-password", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects cross-site form content before parsing or hashing", async () => {
    const response = await POST(
      new Request("https://studio.test/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          token: "a".repeat(43),
          newPassword: "Strongpass1",
          confirmPassword: "Strongpass1",
        }),
      }),
    );

    expect(response.status).toBe(415);
    expect(passwordResetService.consume).not.toHaveBeenCalled();
  });

  it("validates password policy before touching the reset store", async () => {
    const response = await POST(
      resetRequest({ token: "a".repeat(43), newPassword: "weak", confirmPassword: "weak" }),
    );

    expect(response.status).toBe(400);
    expect(passwordResetService.consume).not.toHaveBeenCalled();
    expect(response.headers.get("cache-control")).toContain("no-store");
  });

  it("returns the same safe error for expired, used, or unknown links", async () => {
    vi.mocked(passwordResetService.consume).mockResolvedValue(false);

    const response = await POST(
      resetRequest({
        token: "a".repeat(43),
        newPassword: "Strongpass1",
        confirmPassword: "Strongpass1",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "This reset link is invalid, expired, or already used.",
    });
  });

  it("confirms successful one-time consumption", async () => {
    vi.mocked(passwordResetService.consume).mockResolvedValue(true);

    const response = await POST(
      resetRequest({
        token: "a".repeat(43),
        newPassword: "Strongpass1",
        confirmPassword: "Strongpass1",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });
});
