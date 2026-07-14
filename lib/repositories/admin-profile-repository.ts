import "server-only";

import type {
  AdminProfilePreferences,
  AdminProfileRecord,
} from "@/lib/mocks/admin-profile";
import { withSupabaseFallback } from "@/lib/supabase/errors";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});

function getInitials(name: string | null | undefined, email: string | null | undefined) {
  const source = name?.trim() || email?.trim() || "Admin User";
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function getDefaultAdminProfileData(): {
  profile: AdminProfileRecord;
  metrics: Array<{
    id: string;
    label: string;
    value: string;
    detail: string;
    iconKey: "shield-check" | "timer-reset" | "trophy" | "bell-ring";
  }>;
  preferences: AdminProfilePreferences;
} {
  return {
    profile: {
      fullName: "Admin User",
      roleLabel: "Studio Admin",
      email: "No email",
      phone: "No phone on file",
      location: "Studio HQ",
      bio: "Manages leads, clients, schedules, and day-to-day studio operations.",
      initials: "AU",
      joinedLabel: "Joined recently",
      credentialsNote:
        "Password changes are available from this profile and are applied to your signed-in account.",
    },
    metrics: [
      {
        id: "approvals",
        label: "Pending approvals",
        value: "0",
        detail: "Leads that still need admin follow-up or approval.",
        iconKey: "shield-check",
      },
      {
        id: "response-time",
        label: "Ops response time",
        value: "Clear",
        detail: "Quick snapshot of whether the lead inbox needs attention.",
        iconKey: "timer-reset",
      },
      {
        id: "member-sentiment",
        label: "Active plans",
        value: "0",
        detail: "Current active subscriptions in the database.",
        iconKey: "trophy",
      },
      {
        id: "alerts",
        label: "Live alerts",
        value: "0",
        detail: "Accounts needing payment or renewal attention.",
        iconKey: "bell-ring",
      },
    ],
    preferences: {
      emailUpdates: true,
      mobileAlerts: true,
      renewalEscalations: false,
    },
  };
}

export class AdminProfileRepository {
  async getByUserId(userId: string): Promise<{
    profile: AdminProfileRecord;
    metrics: Array<{
      id: string;
      label: string;
      value: string;
      detail: string;
      iconKey: "shield-check" | "timer-reset" | "trophy" | "bell-ring";
    }>;
    preferences: AdminProfilePreferences;
  }> {
    return withSupabaseFallback(async () => {
      const supabase = getSupabaseServerClient();
      const [userResult, approvalsResult, plansResult, alertsResult] =
        await Promise.all([
          supabase
            .from("User")
            .select("name,email,createdAt")
            .eq("id", userId)
            .single(),
          supabase
            .from("Lead")
            .select("id", { count: "exact", head: true })
            .in("status", ["NEW", "CONTACTED"]),
          supabase
            .from("ClientSubscription")
            .select("id", { count: "exact", head: true })
            .eq("status", "ACTIVE"),
          supabase
            .from("ClientSubscription")
            .select("renewsAt,payments:Payment(id)"),
        ]);
      if (userResult.error) throw userResult.error;
      if (approvalsResult.error) throw approvalsResult.error;
      if (plansResult.error) throw plansResult.error;
      if (alertsResult.error) throw alertsResult.error;

      const user = userResult.data;
      const pendingApprovals = approvalsResult.count ?? 0;
      const activePlans = plansResult.count ?? 0;
      const renewalLimit = Date.now() + 7 * 24 * 60 * 60 * 1000;
      const liveAlerts = alertsResult.data.filter(
        (subscription) =>
          (subscription.renewsAt !== null &&
            new Date(subscription.renewsAt).getTime() < renewalLimit) ||
          subscription.payments.length === 0
      ).length;

      return {
        profile: {
          fullName: user.name ?? "Admin User",
          roleLabel: "Studio Admin",
          email: user.email ?? "No email",
          phone: "No phone on file",
          location: "Studio HQ",
          bio: "Manages leads, clients, schedules, and day-to-day studio operations.",
          initials: getInitials(user.name, user.email),
          joinedLabel: `Joined ${dateFormatter.format(new Date(user.createdAt))}`,
          credentialsNote: "Password changes are available from this profile and are applied to your signed-in account.",
        },
        metrics: [
          {
            id: "approvals",
            label: "Pending approvals",
            value: `${pendingApprovals}`,
            detail: "Leads that still need admin follow-up or approval.",
            iconKey: "shield-check" as const,
          },
          {
            id: "response-time",
            label: "Ops response time",
            value: pendingApprovals > 0 ? "Live queue" : "Clear",
            detail: "Quick snapshot of whether the lead inbox needs attention.",
            iconKey: "timer-reset" as const,
          },
          {
            id: "member-sentiment",
            label: "Active plans",
            value: `${activePlans}`,
            detail: "Current active subscriptions in the database.",
            iconKey: "trophy" as const,
          },
          {
            id: "alerts",
            label: "Live alerts",
            value: `${liveAlerts}`,
            detail: "Accounts needing payment or renewal attention.",
            iconKey: "bell-ring" as const,
          },
        ],
        preferences: {
          emailUpdates: true,
          mobileAlerts: true,
          renewalEscalations: liveAlerts > 0,
        },
      };
    }, getDefaultAdminProfileData());
  }
}

export const adminProfileRepository = new AdminProfileRepository();
