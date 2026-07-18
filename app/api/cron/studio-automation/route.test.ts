import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/automation/studio-automation", () => ({
  runStudioAutomation: vi.fn(),
}));

import { runStudioAutomation } from "@/lib/automation/studio-automation";
import { GET } from "./route";

function cronRequest(secret = "test-cron-secret") {
  return new Request("https://studio.test/api/cron/studio-automation", {
    headers: { Authorization: `Bearer ${secret}` },
  });
}

describe("GET /api/cron/studio-automation", () => {
  beforeEach(() => {
    vi.stubEnv("CRON_SECRET", "test-cron-secret");
    vi.clearAllMocks();
  });
  afterEach(() => vi.unstubAllEnvs());

  it("rejects missing and incorrect bearer credentials", async () => {
    const missing = await GET(
      new Request("https://studio.test/api/cron/studio-automation"),
    );
    const wrong = await GET(cronRequest("wrong-secret"));

    expect(missing.status).toBe(401);
    expect(wrong.status).toBe(401);
    expect(runStudioAutomation).not.toHaveBeenCalled();
  });

  it("returns auditable success data without cacheability", async () => {
    vi.mocked(runStudioAutomation).mockResolvedValue({
      runId: "run-1",
      notificationsCreated: 4,
    });

    const response = await GET(cronRequest());

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    await expect(response.json()).resolves.toEqual({
      success: true,
      runId: "run-1",
      notificationsCreated: 4,
    });
  });

  it("returns a safe failure while the service records the run", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(runStudioAutomation).mockRejectedValue(new Error("private db detail"));

    const response = await GET(cronRequest());

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Automation failed" });
    consoleError.mockRestore();
  });
});
