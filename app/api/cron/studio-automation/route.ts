import { runStudioAutomation } from "@/lib/automation/studio-automation";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return Response.json({ success: true, ...(await runStudioAutomation()) });
  } catch (error) {
    console.error("Studio automation failed", error);
    return Response.json({ error: "Automation failed" }, { status: 500 });
  }
}
