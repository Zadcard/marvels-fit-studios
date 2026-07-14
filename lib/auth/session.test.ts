import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  getSupabaseServerClient: vi.fn(),
}));

import { auth } from "@/auth";
import { requireRole, requireUser } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function mockPersistedUserResult(result: { data: unknown; error: unknown }) {
  const maybeSingle = vi.fn().mockResolvedValue(result);
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));

  vi.mocked(getSupabaseServerClient).mockReturnValue({ from } as never);
}

describe("server authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "user-1",
        email: "admin@example.com",
        name: "JWT Admin",
        role: "ADMIN",
      },
      expires: new Date(Date.now() + 60_000).toISOString(),
    } as never);
  });

  it("fails closed when the persisted user query fails", async () => {
    mockPersistedUserResult({
      data: null,
      error: { code: "PGRST000", message: "database unavailable" },
    });

    await expect(requireUser()).rejects.toThrow(
      "Database operation failed: load authenticated user"
    );
  });

  it("rejects a valid JWT when the user no longer exists", async () => {
    mockPersistedUserResult({ data: null, error: null });

    await expect(requireUser()).rejects.toThrow("Unauthorized");
  });

  it("authorizes against the persisted role instead of the JWT role", async () => {
    mockPersistedUserResult({
      data: {
        id: "user-1",
        email: "admin@example.com",
        name: "Persisted Client",
        mustChangePassword: false,
        role: "CLIENT",
      },
      error: null,
    });

    await expect(requireRole("ADMIN")).rejects.toThrow("Unauthorized");
    await expect(requireRole("CLIENT")).resolves.toMatchObject({
      id: "user-1",
      role: "CLIENT",
    });
  });
});
