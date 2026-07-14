import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function requireCoachProfile(userId: string) {
  const { data: coach, error } = await getSupabaseServerClient()
    .from("Coach")
    .select("id,userId,fullName")
    .eq("userId", userId)
    .maybeSingle();

  if (error) throw error;
  if (!coach) throw new Error("Coach profile not found.");

  return coach;
}

export async function requireCoachClientAccess(userId: string, clientId: string) {
  const coach = await requireCoachProfile(userId);
  const { data: client, error } = await getSupabaseServerClient()
    .from("Client")
    .select(
      `
      id,fullName,
      group:Group(coach:Coach(userId)),
      bookings:SessionBooking(status,
        trainingSession:TrainingSession(status,coach:Coach(userId)))
    `
    )
    .eq("id", clientId)
    .maybeSingle();

  if (error) throw error;

  const hasGroupAccess = client?.group?.coach.userId === userId;
  const hasSessionAccess = client?.bookings.some(
    (booking) =>
      booking.trainingSession.coach.userId === userId &&
      booking.trainingSession.status !== "CANCELED" &&
      ["BOOKED", "ATTENDED", "MISSED", "WAITLIST"].includes(booking.status)
  );

  if (!client || (!hasGroupAccess && !hasSessionAccess)) {
    throw new Error("Client is not assigned to this coach.");
  }

  return { coach, client };
}
