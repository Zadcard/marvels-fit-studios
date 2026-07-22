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
    const [clientsResult, coachesResult, leadsResult, groupsResult] = await Promise.all([
      supabase
        .from("Client")
        .select("id,fullName,status,category:TrainingCategory(name)")
        .order("fullName"),
      supabase
        .from("Coach")
        .select("id,fullName,specialization,user:User(email),qualifications:CoachTrainingCategory(category:TrainingCategory(name))")
        .order("fullName"),
      supabase
        .from("Lead")
        .select("id,fullName,status,source")
        .order("fullName"),
      supabase
        .from("Group")
        .select("id,name,isActive,categoryId,category:TrainingCategory(name)")
        .eq("isActive", true)
        .order("name"),
    ]);

    if (clientsResult.error) throw clientsResult.error;
    if (coachesResult.error) throw coachesResult.error;
    if (leadsResult.error) throw leadsResult.error;
    if (groupsResult.error) throw groupsResult.error;

    const clients: DashboardCommandItem[] = clientsResult.data.map(
      (client, index) => ({
        id: `client-${client.id}`,
        label: client.fullName,
        detail: `${client.category?.name ?? "Program not set"} · ${client.status}`,
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
        detail: coach.qualifications.map((item) => item.category.name).join(", ") || coach.specialization.replaceAll("_", " "),
        kind: "Coach",
        href: searchHref("/admin/coaches", coach.fullName),
        initials: getInitials(coach.fullName),
        tone: toneFor(index),
      }));

    const leads: DashboardCommandItem[] = leadsResult.data.map((lead, index) => ({
      id: `lead-${lead.id}`,
      label: lead.fullName,
      detail: `${lead.source} · ${lead.status.replaceAll("_", " ")}`,
      kind: "Lead",
      href: searchHref("/admin/leads", lead.fullName),
      initials: getInitials(lead.fullName),
      tone: toneFor(index),
    }));
    const groups: DashboardCommandItem[] = groupsResult.data.map((group, index) => ({
      id: `group-${group.id}`,
      label: group.name,
      detail: `${group.category.name} · ${group.isActive ? "Active" : "Inactive"}`,
      kind: "Group",
      href: `/admin/categories?category=${encodeURIComponent(group.categoryId)}`,
      initials: getInitials(group.name),
      tone: toneFor(index),
    }));

    return [...clients, ...coaches, ...leads, ...groups];
  }

  async listForCoachUserId(userId: string): Promise<DashboardCommandItem[]> {
    const { data, error } = await getSupabaseServerClient()
      .from("Client")
      .select(
        "id,fullName,category:TrainingCategory(name),group:Group(coach:Coach(userId)),bookings:SessionBooking(status,trainingSession:TrainingSession(status,coach:Coach(userId)))",
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
        detail: client.category?.name ?? "Program not set",
        kind: "Client" as const,
        href: `/coach/clients?client=${encodeURIComponent(client.id)}`,
        initials: getInitials(client.fullName),
        tone: toneFor(index),
      }));
  }
}

export const dashboardCommandRepository = new DashboardCommandRepository();
