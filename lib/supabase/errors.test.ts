import { describe, expect, it, vi } from "vitest";

import { withSupabaseFallback } from "@/lib/supabase/errors";

describe("withSupabaseFallback", () => {
  it("returns successful database results", async () => {
    await expect(
      withSupabaseFallback(async () => ["client-1"], [])
    ).resolves.toEqual(["client-1"]);
  });

  it("logs and returns the supplied fallback for database failures", async () => {
    const error = new Error("database unavailable");
    const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});

    await expect(
      withSupabaseFallback(async () => {
        throw error;
      }, [])
    ).resolves.toEqual([]);
    expect(consoleWarn).toHaveBeenCalledWith(
      "[withSupabaseFallback] database operation unavailable; rendering fallback:",
      error
    );

    consoleWarn.mockRestore();
  });
});
