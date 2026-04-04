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
import type { DashboardRole } from "@/lib/auth/authorization-policy";
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

type DashboardProfileMeta = {
  name: string;
  subtitle: string;
  initials: string;
};

type DashboardRoleUiMeta = {
  label: string;
  defaultTitle: string;
  defaultSubtitle: string;
  eyebrow: string;
  profile: DashboardProfileMeta;
  searchPrompt: string;
  profileHref: string;
};

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
      available: true,
    },
    {
      label: "Subscriptions",
      href: "/admin/subscriptions",
      icon: CreditCard,
      description: "Plans, renewals, and payment state",
      section: "primary",
      available: true,
    },
    {
      label: "Settings",
      href: "/admin/settings",
      icon: Settings,
      description: "Studio defaults and operational controls",
      section: "secondary",
      available: true,
    },
    {
      label: "Profile",
      href: "/admin/profile",
      icon: UserRound,
      description: "Admin profile and account preferences",
      section: "secondary",
      available: true,
    },
  ],
  coach: [
    {
      label: "Dashboard",
      href: "/coach",
      icon: LayoutDashboard,
      description: "Coaching overview and today's workload",
      section: "primary",
      available: true,
      exact: true,
    },
    {
      label: "Sessions",
      href: "/coach/sessions",
      icon: Dumbbell,
      description: "Assigned sessions and updates",
      section: "primary",
      available: true,
    },
    {
      label: "Clients",
      href: "/coach/clients",
      icon: Users,
      description: "Your roster and client follow-up",
      section: "primary",
      available: true,
    },
    {
      label: "Schedule",
      href: "/coach/schedule",
      icon: CalendarRange,
      description: "Weekly rhythm and coaching calendar",
      section: "primary",
      available: true,
    },
    {
      label: "Settings",
      href: "/coach/settings",
      icon: Settings,
      description: "Preferences and profile settings",
      section: "secondary",
      available: true,
    },
  ],
  client: [
    {
      label: "Dashboard",
      href: "/client",
      icon: LayoutDashboard,
      description: "Training overview and current plan",
      section: "primary",
      available: true,
      exact: true,
    },
    {
      label: "Sessions",
      href: "/client/sessions",
      icon: Dumbbell,
      description: "Upcoming bookings and attendance",
      section: "primary",
      available: true,
    },
    {
      label: "Coach",
      href: "/client/coach",
      icon: ShieldUser,
      description: "Assigned coach and communication",
      section: "primary",
      available: true,
    },
    {
      label: "Subscription",
      href: "/client/subscription",
      icon: CreditCard,
      description: "Plan details and membership state",
      section: "primary",
      available: true,
    },
    {
      label: "Settings",
      href: "/client/settings",
      icon: Settings,
      description: "Personal preferences and profile",
      section: "secondary",
      available: true,
    },
  ],
};

const dashboardRoleUiConfig: Record<DashboardRole, DashboardRoleUiMeta> = {
  admin: {
    label: "Admin workspace",
    defaultTitle: "Admin Dashboard",
    defaultSubtitle:
      "Keep the studio schedule, member flow, and coaching operations aligned.",
    eyebrow: "Admin command deck",
    profile: {
      name: "Layla Mourad",
      subtitle: "Studio director",
      initials: "LM",
    },
    searchPrompt: "Search preview: members, sessions, or coaches",
    profileHref: "/admin/profile",
  },
  coach: {
    label: "Coach workspace",
    defaultTitle: "Coach Dashboard",
    defaultSubtitle:
      "Coordinate sessions, client follow-up, and the week ahead.",
    eyebrow: "Coach workspace",
    profile: {
      name: "Ahmed Waheed",
      subtitle: "Strength coach",
      initials: "AW",
    },
    searchPrompt: "Search preview: sessions, clients, or notes",
    profileHref: "/coach/settings",
  },
  client: {
    label: "Client workspace",
    defaultTitle: "Client Dashboard",
    defaultSubtitle:
      "Track sessions, progress, and the next membership touchpoints.",
    eyebrow: "Client workspace",
    profile: {
      name: "Nour Hassan",
      subtitle: "Hybrid elite",
      initials: "NH",
    },
    searchPrompt: "Search preview: sessions, plan details, or coach notes",
    profileHref: "/client/settings",
  },
};

export function getDashboardRoleLabel(role: DashboardRole) {
  return dashboardRoleUiConfig[role].label;
}

export function getDashboardProfileMeta(role: DashboardRole): DashboardProfileMeta {
  return dashboardRoleUiConfig[role].profile;
}

export function getDashboardSearchPrompt(role: DashboardRole) {
  return dashboardRoleUiConfig[role].searchPrompt;
}

export function getDashboardProfileHref(role: DashboardRole) {
  return dashboardRoleUiConfig[role].profileHref;
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
  const uiMeta = dashboardRoleUiConfig[role];

  return {
    eyebrow: uiMeta.eyebrow,
    title: matchedItem?.label ?? uiMeta.defaultTitle,
    subtitle: matchedItem?.description ?? uiMeta.defaultSubtitle,
  };
}
