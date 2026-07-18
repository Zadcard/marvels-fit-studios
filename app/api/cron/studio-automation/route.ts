import { timingSafeEqual } from "node:crypto";

import { runStudioAutomation } from "@/lib/automation/studio-automation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  const provided = request.headers.get("authorization") ?? "";
  if (!secret) return false;

  const expectedBuffer = Buffer.from(`Bearer ${secret}`);
  const providedBuffer = Buffer.from(provided);
  return (
    expectedBuffer.length === providedBuffer.length &&
    timingSafeEqual(expectedBuffer, providedBuffer)
  );
}

function jsonResponse(body: object, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  try {
    return jsonResponse({ success: true, ...(await runStudioAutomation()) });
  } catch (error) {
    console.error("Studio automation failed", error);
    return jsonResponse({ error: "Automation failed" }, 500);
  }
}
