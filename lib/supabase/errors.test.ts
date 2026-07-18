import { describe, expect, it, vi } from "vitest";

import {
  OperationalDataUnavailableError,
  withSupabaseFallback,
} from "@/lib/supabase/errors";

describe("withSupabaseFallback", () => {
  it("returns successful database results", async () => {
    await expect(
      withSupabaseFallback(async () => ["client-1"], []),
    ).resolves.toEqual(["client-1"]);
  });

  it("logs and rejects with an honest unavailable state for database failures", async () => {
    const error = new Error("database unavailable");
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      withSupabaseFallback(async () => {
        throw error;
      }, []),
    ).rejects.toBeInstanceOf(OperationalDataUnavailableError);
    expect(consoleError).toHaveBeenCalledWith(
      "[withSupabaseFallback] database operation unavailable:",
      error,
    );

    consoleError.mockRestore();
  });

  it("does not expose the database cause or return believable fallback data", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const promise = withSupabaseFallback(async () => {
      throw new Error("relation private_table does not exist");
    }, ["believable-empty-fallback"]);

    await expect(promise).rejects.toMatchObject({
      message: expect.not.stringContaining("private_table"),
    });
    await expect(promise).rejects.toMatchObject({
      message: expect.stringContaining("No empty totals are being shown"),
    });
    consoleError.mockRestore();
  });
});
