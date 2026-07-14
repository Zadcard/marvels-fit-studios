"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import { UserRole } from "@/lib/supabase/domain";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { clientCheckInInputSchema } from "@/lib/validators/transformation";

export async function submitClientCheckIn(input: unknown) {
  const parsed = clientCheckInInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid check-in.");
  }

  const user = await requireRole(UserRole.CLIENT);
  const supabase = getSupabaseServerClient();
  const { data: client, error: clientError } = await supabase
    .from("Client")
    .select("id")
    .eq("userId", user.id)
    .maybeSingle();
  if (clientError) throw clientError;
  if (!client) throw new Error("Client profile not found.");

  const { error } = await supabase.from("ClientCheckIn").insert({
    clientId: client.id,
    sleepQuality: parsed.data.sleepQuality,
    energyLevel: parsed.data.energyLevel,
    sorenessLevel: parsed.data.sorenessLevel,
    stressLevel: parsed.data.stressLevel,
    painPresent: parsed.data.painPresent,
    painDetails: parsed.data.painDetails || null,
    memberNote: parsed.data.memberNote || null,
  });
  if (error) throw error;

  revalidatePath("/client");
  revalidatePath("/client/progress");
  revalidatePath("/coach");
  revalidatePath("/coach/clients");
}
