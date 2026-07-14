import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  getSupabaseServerClient: vi.fn(),
}));

import {
  AuthRateLimitError,
  AuthSecurityService,
} from "@/lib/auth/auth-security-service";
import { getSupabaseServerClient } from "@/lib/supabase/server";

describe("AuthSecurityService", () => {
  const rpc = vi.fn();
  const service = new AuthSecurityService();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSupabaseServerClient).mockReturnValue({ rpc } as never);
  });

  it("creates opaque hashes without retaining the identifier or IP", () => {
    const request = new Request("https://studio.test/login", {
      headers: { "x-real-ip": "203.0.113.42" },
    });

    const context = service.createAttemptContext(
      request,
      "ADMIN@EXAMPLE.COM",
      "email"
    );

    expect(context.method).toBe("email");
    expect(context.keyHash).toMatch(/^[a-f0-9]{64}$/);
    expect(context.identifierHash).toMatch(/^[a-f0-9]{64}$/);
    expect(context.ipHash).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(context)).not.toContain("admin@example.com");
    expect(JSON.stringify(context)).not.toContain("203.0.113.42");
  });

  it("allows a login when the database throttle permits it", async () => {
    rpc.mockResolvedValue({
      data: { allowed: true, retryAfterSeconds: 0 },
      error: null,
    });

    await expect(
      service.assertAttemptAllowed({
        keyHash: "key",
        identifierHash: "identifier",
        ipHash: "ip",
        method: "email",
      })
    ).resolves.toBeUndefined();
  });

  it("rejects a throttled login with the database retry duration", async () => {
    rpc.mockResolvedValue({
      data: { allowed: false, retryAfterSeconds: 420 },
      error: null,
    });

    const promise = service.assertAttemptAllowed({
      keyHash: "key",
      identifierHash: "identifier",
      ipHash: "ip",
      method: "client_id",
    });

    await expect(promise).rejects.toBeInstanceOf(AuthRateLimitError);
    await expect(promise).rejects.toMatchObject({ retryAfterSeconds: 420 });
  });

  it("records successful and failed attempts through the atomic RPC", async () => {
    rpc.mockResolvedValue({ data: {}, error: null });
    const context = {
      keyHash: "key",
      identifierHash: "identifier",
      ipHash: "ip",
      method: "email" as const,
    };

    await service.recordAttempt(context, true, "user-1");
    await service.recordAttempt(context, false, null);

    expect(rpc).toHaveBeenNthCalledWith(1, "record_auth_attempt", {
      p_key_hash: "key",
      p_identifier_hash: "identifier",
      p_ip_hash: "ip",
      p_auth_method: "email",
      p_success: true,
      p_user_id: "user-1",
    });
    expect(rpc).toHaveBeenNthCalledWith(2, "record_auth_attempt", {
      p_key_hash: "key",
      p_identifier_hash: "identifier",
      p_ip_hash: "ip",
      p_auth_method: "email",
      p_success: false,
      p_user_id: undefined,
    });
  });
});
