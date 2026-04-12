import type { LucideIcon } from "lucide-react";
import {
  ClipboardList,
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
      description: "Live priorities",
      section: "primary",
      available: true,
      exact: true,
    },
    {
      label: "Leads",
      href: "/admin/leads",
      icon: ClipboardList,
      description: "Queue and approval",
      section: "primary",
      available: true,
    },
    {
      label: "Clients",
      href: "/admin/clients",
      icon: Users,
      description: "Roster and status",
      section: "primary",
      available: true,
    },
    {
      label: "Coaches",
      href: "/admin/coaches",
      icon: ShieldUser,
      description: "Coverage and load",
      section: "primary",
      available: true,
    },
    {
      label: "Sessions",
      href: "/admin/sessions",
      icon: Dumbbell,
      description: "Live sessions",
      section: "primary",
      available: true,
    },
    {
      label: "Schedule",
      href: "/admin/schedule",
      icon: CalendarRange,
      description: "Week planning",
      section: "primary",
      available: true,
    },
    {
      label: "Subscriptions",
      href: "/admin/subscriptions",
      icon: CreditCard,
      description: "Plans and renewals",
      section: "primary",
      available: true,
    },
    {
      label: "Settings",
      href: "/admin/settings",
      icon: Settings,
      description: "Studio controls",
      section: "secondary",
      available: true,
    },
    {
      label: "Profile",
      href: "/admin/profile",
      icon: UserRound,
      description: "Account and access",
      section: "secondary",
      available: true,
    },
  ],
  coach: [
    {
      label: "Dashboard",
      href: "/coach",
      icon: LayoutDashboard,
      description: "Today and next",
      section: "primary",
      available: true,
      exact: true,
    },
    {
      label: "Sessions",
      href: "/coach/sessions",
      icon: Dumbbell,
      description: "Assigned sessions",
      section: "primary",
      available: true,
    },
    {
      label: "Clients",
      href: "/coach/clients",
      icon: Users,
      description: "Roster and follow-up",
      section: "primary",
      available: true,
    },
    {
      label: "Schedule",
      href: "/coach/schedule",
      icon: CalendarRange,
      description: "Weekly schedule",
      section: "primary",
      available: true,
    },
    {
      label: "Settings",
      href: "/coach/settings",
      icon: Settings,
      description: "Profile and alerts",
      section: "secondary",
      available: true,
    },
  ],
  client: [
    {
      label: "Dashboard",
      href: "/client",
      icon: LayoutDashboard,
      description: "Training overview",
      section: "primary",
      available: true,
      exact: true,
    },
    {
      label: "Sessions",
      href: "/client/sessions",
      icon: Dumbbell,
      description: "Bookings",
      section: "primary",
      available: true,
    },
    {
      label: "Coach",
      href: "/client/coach",
      icon: ShieldUser,
      description: "Coach and contact",
      section: "primary",
      available: true,
    },
    {
      label: "Subscription",
      href: "/client/subscription",
      icon: CreditCard,
      description: "Plan details",
      section: "primary",
      available: true,
    },
    {
      label: "Settings",
      href: "/client/settings",
      icon: Settings,
      description: "Profile and alerts",
      section: "secondary",
      available: true,
    },
  ],
};

const dashboardRoleUiConfig: Record<DashboardRole, DashboardRoleUiMeta> = {
  admin: {
    label: "Admin",
    defaultTitle: "Admin Dashboard",
    defaultSubtitle: "Live priorities and studio control.",
    eyebrow: "Admin portal",
    profile: {
      name: "Layla Mourad",
      subtitle: "Studio director",
      initials: "LM",
    },
    searchPrompt: "Search leads, clients, or sessions",
    profileHref: "/admin/profile",
  },
  coach: {
    label: "Coach",
    defaultTitle: "Coach Dashboard",
    defaultSubtitle: "Sessions, roster, and follow-up.",
    eyebrow: "Coach portal",
    profile: {
      name: "Ahmed Waheed",
      subtitle: "Strength coach",
      initials: "AW",
    },
    searchPrompt: "Search sessions or clients",
    profileHref: "/coach/settings",
  },
  client: {
    label: "Client",
    defaultTitle: "Client Dashboard",
    defaultSubtitle: "Sessions, plan, and progress.",
    eyebrow: "Client portal",
    profile: {
      name: "Nour Hassan",
      subtitle: "Hybrid elite",
      initials: "NH",
    },
    searchPrompt: "Search sessions or plans",
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
