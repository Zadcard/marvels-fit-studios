import { describe, expect, it, vi } from "vitest";

import { withSupabaseFallback } from "@/lib/supabase/errors";

describe("withSupabaseFallback", () => {
  it("returns successful database results", async () => {
    await expect(
      withSupabaseFallback(async () => ["client-1"], [])
    ).resolves.toEqual(["client-1"]);
  });

  it("logs and rethrows database failures instead of rendering empty data", async () => {
    const error = new Error("database unavailable");
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      withSupabaseFallback(async () => {
        throw error;
      }, [])
    ).rejects.toBe(error);
    expect(consoleError).toHaveBeenCalledWith(
      "[withSupabaseFallback] database operation failed:",
      error
    );

    consoleError.mockRestore();
  });
});
