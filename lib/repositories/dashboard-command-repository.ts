import "server-only";

import type { DashboardCommandItem } from "@/lib/dashboard/dashboard-command-item";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getInitials } from "@/lib/utils";

const avatarTones = ["avatar-red", "avatar-violet", "avatar-blue"] as const;

function toneFor(index: number) {
  return avatarTones[index % avatarTones.length];
}

function searchHref(pathname: string, query: string) {
  return `${pathname}?q=${encodeURIComponent(query)}`;
}

export class DashboardCommandRepository {
  async listForAdmin(): Promise<DashboardCommandItem[]> {
    const supabase = getSupabaseServerClient();
    const [clientsResult, coachesResult] = await Promise.all([
      supabase
        .from("Client")
        .select("id,fullName,status,trainingCategory")
        .order("fullName"),
      supabase
        .from("Coach")
        .select("id,fullName,specialization,user:User(email)")
        .order("fullName"),
    ]);

    if (clientsResult.error) throw clientsResult.error;
    if (coachesResult.error) throw coachesResult.error;

    const clients: DashboardCommandItem[] = clientsResult.data.map(
      (client, index) => ({
        id: `client-${client.id}`,
        label: client.fullName,
        detail: `${client.trainingCategory.replaceAll("_", " ")} · ${client.status}`,
        kind: "Client",
        href: searchHref("/admin/clients", client.fullName),
        initials: getInitials(client.fullName),
        tone: toneFor(index),
      }),
    );
    const coaches: DashboardCommandItem[] = coachesResult.data
      .filter(
        (coach) => coach.user?.email?.toLowerCase() !== "coach@test.com",
      )
      .map((coach, index) => ({
        id: `coach-${coach.id}`,
        label: coach.fullName,
        detail: coach.specialization.replaceAll("_", " "),
        kind: "Coach",
        href: searchHref("/admin/coaches", coach.fullName),
        initials: getInitials(coach.fullName),
        tone: toneFor(index),
      }));

    return [...clients, ...coaches];
  }

  async listForCoachUserId(userId: string): Promise<DashboardCommandItem[]> {
    const { data, error } = await getSupabaseServerClient()
      .from("Client")
      .select(
        "id,fullName,trainingCategory,group:Group(coach:Coach(userId)),bookings:SessionBooking(status,trainingSession:TrainingSession(status,coach:Coach(userId)))",
      )
      .order("fullName");
    if (error) throw error;

    return data
      .filter(
        (client) =>
          client.group?.coach.userId === userId ||
          client.bookings.some(
            (booking) =>
              ["BOOKED", "ATTENDED", "MISSED", "WAITLIST"].includes(
                booking.status,
              ) &&
              booking.trainingSession.status !== "CANCELED" &&
              booking.trainingSession.coach.userId === userId,
          ),
      )
      .map((client, index) => ({
        id: `client-${client.id}`,
        label: client.fullName,
        detail: client.trainingCategory.replaceAll("_", " "),
        kind: "Client" as const,
        href: `/coach/clients?client=${encodeURIComponent(client.id)}`,
        initials: getInitials(client.fullName),
        tone: toneFor(index),
      }));
  }
}

export const dashboardCommandRepository = new DashboardCommandRepository();
