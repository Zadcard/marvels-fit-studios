import "server-only";

import type {
  AdminProfilePreferences,
  AdminProfileRecord,
} from "@/lib/mocks/admin-profile";
import { getPrisma, withPrismaFallback } from "@/lib/prisma";

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
  private get prisma() {
    return getPrisma();
  }

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
    return withPrismaFallback(async () => {
      const [user, pendingApprovals, activePlans, liveAlerts] = await Promise.all([
        this.prisma.user.findUniqueOrThrow({
          where: { id: userId },
          select: {
            name: true,
            email: true,
            createdAt: true,
          },
        }),
        this.prisma.lead.count({
          where: {
            status: {
              in: ["NEW", "CONTACTED"],
            },
          },
        }),
        this.prisma.clientSubscription.count({
          where: {
            status: "ACTIVE",
          },
        }),
        this.prisma.clientSubscription.count({
          where: {
            OR: [
              {
                renewsAt: {
                  lt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                },
              },
              {
                payments: {
                  none: {},
                },
              },
            ],
          },
        }),
      ]);

      return {
        profile: {
          fullName: user.name ?? "Admin User",
          roleLabel: "Studio Admin",
          email: user.email ?? "No email",
          phone: "No phone on file",
          location: "Studio HQ",
          bio: "Manages leads, clients, schedules, and day-to-day studio operations.",
          initials: getInitials(user.name, user.email),
          joinedLabel: `Joined ${dateFormatter.format(user.createdAt)}`,
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
