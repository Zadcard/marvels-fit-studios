import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";

type AutomationResult = {
  notificationsCreated: number;
  runId: string;
  status: "SUCCEEDED" | "FAILED";
};

export class StudioAutomationFailedError extends Error {
  constructor(readonly runId: string) {
    super("Studio notification automation failed.");
    this.name = "StudioAutomationFailedError";
  }
}

function parseAutomationResult(value: unknown): AutomationResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid studio automation response.");
  }

  const result = value as Partial<AutomationResult>;
  if (
    typeof result.runId !== "string" ||
    typeof result.notificationsCreated !== "number" ||
    (result.status !== "SUCCEEDED" && result.status !== "FAILED")
  ) {
    throw new Error("Invalid studio automation response.");
  }

  return result as AutomationResult;
}

export async function runStudioAutomation(now = new Date()) {
  const { data, error } = await getSupabaseServerClient().rpc(
    "run_studio_notification_automation",
    { p_now: now.toISOString() },
  );
  if (error) throw error;

  const result = parseAutomationResult(data);
  if (result.status === "FAILED") {
    throw new StudioAutomationFailedError(result.runId);
  }

  return {
    notificationsCreated: result.notificationsCreated,
    runId: result.runId,
  };
}
