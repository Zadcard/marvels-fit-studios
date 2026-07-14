import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function runStudioAutomation(now = new Date()) {
  const supabase = getSupabaseServerClient();
  const { data: run, error: runError } = await supabase
    .from("AutomationRun")
    .insert({ jobName: "studio-notifications", status: "RUNNING" })
    .select("id")
    .single();
  if (runError) throw runError;

  const { data, error } = await supabase.rpc("enqueue_studio_notifications", {
    p_now: now.toISOString(),
  });
  if (error) {
    await supabase.from("AutomationRun").update({
      status: "FAILED",
      errorMessage: error.message.slice(0, 1000),
      finishedAt: new Date().toISOString(),
    }).eq("id", run.id);
    throw error;
  }

  const { error: completeError } = await supabase.from("AutomationRun").update({
    status: "SUCCEEDED",
    notificationsCreated: data,
    finishedAt: new Date().toISOString(),
  }).eq("id", run.id);
  if (completeError) throw completeError;
  return { notificationsCreated: data, runId: run.id };
}
