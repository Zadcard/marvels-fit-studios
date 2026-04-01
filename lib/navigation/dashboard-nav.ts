import type { LucideIcon } from "lucide-react";
import {
  CalendarRange,
  CreditCard,
  Dumbbell,
  LayoutDashboard,
  Settings,
  ShieldUser,
  UserRound,
  Users,
} from "lucide-react";

export type DashboardRole = "admin" | "coach" | "client";
export type DashboardNavSection = "primary" | "secondary";

export type DashboardNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
  section: DashboardNavSection;
  available: boolean;
  badge?: string;
  exact?: boolean;
};

const comingSoon = "Soon";

const dashboardNavConfig: Record<DashboardRole, DashboardNavItem[]> = {
  admin: [
    {
      label: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
      description: "Overview, pace, and weekly studio signals",
      section: "primary",
      available: true,
      exact: true,
    },
    {
      label: "Clients",
      href: "/admin/clients",
      icon: Users,
      description: "Membership roster and client operations",
      section: "primary",
      available: true,
    },
    {
      label: "Coaches",
      href: "/admin/coaches",
      icon: ShieldUser,
      description: "Coaching team management and capacity",
      section: "primary",
      available: true,
    },
    {
      label: "Sessions",
      href: "/admin/sessions",
      icon: Dumbbell,
      description: "Group and private session control",
      section: "primary",
      available: true,
    },
    {
      label: "Schedule",
      href: "/admin/schedule",
      icon: CalendarRange,
      description: "Calendar and occupancy planning",
      section: "primary",
      available: false,
      badge: comingSoon,
    },
    {
      label: "Subscriptions",
      href: "/admin/subscriptions",
      icon: CreditCard,
      description: "Plans, renewals, and payment state",
      section: "primary",
      available: false,
      badge: comingSoon,
    },
    {
      label: "Settings",
      href: "/admin/settings",
      icon: Settings,
      description: "Studio defaults and operational controls",
      section: "secondary",
      available: false,
      badge: comingSoon,
    },
    {
      label: "Profile",
      href: "/admin/profile",
      icon: UserRound,
      description: "Admin profile and account preferences",
      section: "secondary",
      available: false,
      badge: comingSoon,
    },
  ],
  coach: [
    {
      label: "Dashboard",
      href: "/coach",
      icon: LayoutDashboard,
      description: "Coaching overview and today’s workload",
      section: "primary",
      available: false,
      badge: comingSoon,
      exact: true,
    },
    {
      label: "Sessions",
      href: "/coach/sessions",
      icon: Dumbbell,
      description: "Assigned sessions and updates",
      section: "primary",
      available: false,
      badge: comingSoon,
    },
    {
      label: "Clients",
      href: "/coach/clients",
      icon: Users,
      description: "Your roster and client follow-up",
      section: "primary",
      available: false,
      badge: comingSoon,
    },
    {
      label: "Schedule",
      href: "/coach/schedule",
      icon: CalendarRange,
      description: "Weekly rhythm and coaching calendar",
      section: "primary",
      available: false,
      badge: comingSoon,
    },
    {
      label: "Settings",
      href: "/coach/settings",
      icon: Settings,
      description: "Preferences and profile settings",
      section: "secondary",
      available: false,
      badge: comingSoon,
    },
  ],
  client: [
    {
      label: "Dashboard",
      href: "/client",
      icon: LayoutDashboard,
      description: "Training overview and current plan",
      section: "primary",
      available: false,
      badge: comingSoon,
      exact: true,
    },
    {
      label: "Sessions",
      href: "/client/sessions",
      icon: Dumbbell,
      description: "Upcoming bookings and attendance",
      section: "primary",
      available: false,
      badge: comingSoon,
    },
    {
      label: "Coach",
      href: "/client/coach",
      icon: ShieldUser,
      description: "Assigned coach and communication",
      section: "primary",
      available: false,
      badge: comingSoon,
    },
    {
      label: "Subscription",
      href: "/client/subscription",
      icon: CreditCard,
      description: "Plan details and membership state",
      section: "primary",
      available: false,
      badge: comingSoon,
    },
    {
      label: "Settings",
      href: "/client/settings",
      icon: Settings,
      description: "Personal preferences and profile",
      section: "secondary",
      available: false,
      badge: comingSoon,
    },
  ],
};

export function getDashboardRoleFromPath(pathname: string): DashboardRole {
  if (pathname.startsWith("/coach")) {
    return "coach";
  }

  if (pathname.startsWith("/client")) {
    return "client";
  }

  return "admin";
}

export function getDashboardRoleLabel(role: DashboardRole) {
  switch (role) {
    case "coach":
      return "Coach workspace";
    case "client":
      return "Client workspace";
    default:
      return "Admin workspace";
  }
}

export function getDashboardNav(role: DashboardRole) {
  return dashboardNavConfig[role];
}

export function isDashboardNavItemActive(
  item: DashboardNavItem,
  pathname: string
) {
  if (pathname === item.href) {
    return true;
  }

  if (item.exact) {
    return false;
  }

  return pathname.startsWith(`${item.href}/`);
}

export function getDashboardRouteMeta(pathname: string, role: DashboardRole) {
  const matchedItem = getDashboardNav(role)
    .filter((item) => item.available)
    .find((item) => isDashboardNavItemActive(item, pathname));

  if (role === "coach") {
    return {
      eyebrow: "Coach workspace",
      title: matchedItem?.label ?? "Coach Dashboard",
      subtitle:
        matchedItem?.description ??
        "Coordinate sessions, client follow-up, and the week ahead.",
    };
  }

  if (role === "client") {
    return {
      eyebrow: "Client workspace",
      title: matchedItem?.label ?? "Client Dashboard",
      subtitle:
        matchedItem?.description ??
        "Track sessions, progress, and the next membership touchpoints.",
    };
  }

  return {
    eyebrow: "Admin command deck",
    title: matchedItem?.label ?? "Admin Dashboard",
    subtitle:
      matchedItem?.description ??
      "Keep the studio schedule, member flow, and coaching operations aligned.",
  };
}
