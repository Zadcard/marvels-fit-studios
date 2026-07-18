import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  getSupabaseServerClient: vi.fn(),
}));

import {
  runStudioAutomation,
  StudioAutomationFailedError,
} from "@/lib/automation/studio-automation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

describe("runStudioAutomation", () => {
  const rpc = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSupabaseServerClient).mockReturnValue({ rpc } as never);
  });

  it("runs the atomic database workflow with an explicit timestamp", async () => {
    rpc.mockResolvedValue({
      data: { runId: "run-1", status: "SUCCEEDED", notificationsCreated: 3 },
      error: null,
    });
    const now = new Date("2026-07-18T03:00:00.000Z");

    await expect(runStudioAutomation(now)).resolves.toEqual({
      runId: "run-1",
      notificationsCreated: 3,
    });
    expect(rpc).toHaveBeenCalledWith("run_studio_notification_automation", {
      p_now: now.toISOString(),
    });
  });

  it("surfaces a recorded failed run without exposing its database message", async () => {
    rpc.mockResolvedValue({
      data: { runId: "run-failed", status: "FAILED", notificationsCreated: 0 },
      error: null,
    });

    const promise = runStudioAutomation();
    await expect(promise).rejects.toBeInstanceOf(StudioAutomationFailedError);
    await expect(promise).rejects.toMatchObject({ runId: "run-failed" });
  });

  it("rejects malformed stored-procedure responses", async () => {
    rpc.mockResolvedValue({ data: { status: "SUCCEEDED" }, error: null });
    await expect(runStudioAutomation()).rejects.toThrow(
      "Invalid studio automation response",
    );
  });
});
