import type { LucideIcon } from "lucide-react";
import {
  Bell,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  ChartNoAxesCombined,
  ClipboardList,
  CreditCard,
  Dumbbell,
  LayoutDashboard,
  Settings,
  ShieldAlert,
  ShieldUser,
  UserRoundX,
  Users,
  UsersRound,
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

type DashboardProfileMeta = { name: string; subtitle: string; initials: string };
type DashboardRoleUiMeta = {
  label: string;
  defaultTitle: string;
  defaultSubtitle: string;
  eyebrow: string;
  profile: DashboardProfileMeta;
  searchPrompt: string;
  profileHref: string;
};
type OpsRole = Exclude<DashboardRole, "client">;

const dashboardNavConfig: Record<OpsRole, DashboardNavItem[]> = {
  admin: [
    {
      label: "Overview",
      href: "/admin",
      icon: LayoutDashboard,
      description: "Real-time daily operations & live sessions",
      section: "primary",
      available: true,
      exact: true,
    },
    {
      label: "Schedule",
      href: "/admin/schedule",
      icon: CalendarRange,
      description: "Chronological agenda, weekly timeline & attendance roster",
      section: "primary",
      available: true,
    },
    {
      label: "Members",
      href: "/admin/clients",
      icon: Users,
      description: "Central studio directory, active members, leads, lapsed trials & WhatsApp outreach",
      section: "primary",
      available: true,
    },
    {
      label: "Programs",
      href: "/admin/categories",
      icon: UsersRound,
      description: "Training categories, active group series & templates",
      section: "primary",
      available: true,
    },
    {
      label: "Coaches",
      href: "/admin/coaches",
      icon: ShieldUser,
      description: "Staff qualifications & group assignments",
      section: "primary",
      available: true,
    },
    {
      label: "Subscriptions",
      href: "/admin/subscriptions",
      icon: CreditCard,
      description: "Membership plans & upcoming renewals",
      section: "secondary",
      available: true,
    },
    {
      label: "Analytics",
      href: "/admin/reports",
      icon: ChartNoAxesCombined,
      description: "Revenue metrics, attendance rates & CSV exports",
      section: "secondary",
      available: true,
    },
    {
      label: "Alerts",
      href: "/admin/notifications",
      icon: Bell,
      description: "System alerts & schedule change logs",
      section: "secondary",
      available: true,
    },
    {
      label: "Settings",
      href: "/admin/settings",
      icon: Settings,
      description: "Studio profile, working hours & configuration",
      section: "secondary",
      available: true,
    },
  ],
  coach: [
    {
      label: "Today",
      href: "/coach",
      icon: LayoutDashboard,
      description: "Today's assigned sessions & live floor status",
      section: "primary",
      available: true,
      exact: true,
    },
    {
      label: "Schedule",
      href: "/coach/schedule",
      icon: CalendarDays,
      description: "Weekly calendar agenda & session shift details",
      section: "primary",
      available: true,
    },
    {
      label: "Members",
      href: "/coach/clients",
      icon: Users,
      description: "Assigned client roster & injury context",
      section: "primary",
      available: true,
    },
    {
      label: "My Groups",
      href: "/coach/groups",
      icon: Dumbbell,
      description: "Groups you coach — everything editable except times",
      section: "primary",
      available: true,
    },
    {
      label: "Programs",
      href: "/coach/categories",
      icon: UsersRound,
      description: "Training categories & group series supervised",
      section: "primary",
      available: true,
    },
    {
      label: "Alerts",
      href: "/coach/alerts",
      icon: ShieldAlert,
      description: "Active client injury warnings & change requests",
      section: "primary",
      available: true,
    },
    {
      label: "Sessions",
      href: "/coach/sessions",
      icon: CalendarClock,
      description: "Session attendance check-ins & coaching notes",
      section: "primary",
      available: true,
    },
    {
      label: "Settings",
      href: "/coach/settings",
      icon: Settings,
      description: "Personal profile details & preferences",
      section: "secondary",
      available: true,
    },
  ],
};

const dashboardRoleUiConfig: Record<OpsRole, DashboardRoleUiMeta> = {
  admin: {
    label: "Admin",
    defaultTitle: "Overview",
    defaultSubtitle: "Real-time daily operations & live sessions",
    eyebrow: "Operations",
    profile: { name: "Admin account", subtitle: "Studio admin", initials: "AD" },
    searchPrompt: "Search clients, coaches, sessions…",
    profileHref: "/admin",
  },
  coach: {
    label: "Coach",
    defaultTitle: "Today",
    defaultSubtitle: "Today's assigned sessions & live floor status",
    eyebrow: "Coach",
    profile: { name: "Coach account", subtitle: "Coach workspace", initials: "CO" },
    searchPrompt: "Search clients or sessions…",
    profileHref: "/coach/settings",
  },
};


function resolveOpsRole(role: DashboardRole): OpsRole {
  return role === "client" ? "coach" : role;
}

export function getDashboardRoleLabel(role: DashboardRole) {
  return role === "client" ? "Unavailable" : dashboardRoleUiConfig[role].label;
}
export function getDashboardProfileMeta(role: DashboardRole): DashboardProfileMeta {
  return dashboardRoleUiConfig[resolveOpsRole(role)].profile;
}
export function getDashboardSearchPrompt(role: DashboardRole) {
  return dashboardRoleUiConfig[resolveOpsRole(role)].searchPrompt;
}
export function getDashboardProfileHref(role: DashboardRole) {
  return dashboardRoleUiConfig[resolveOpsRole(role)].profileHref;
}
export function getDashboardNav(role: DashboardRole) {
  return role === "client" ? [] : dashboardNavConfig[role];
}
export function getDashboardSidebarNav(role: DashboardRole) {
  return getDashboardNav(role);
}

export function isDashboardNavItemActive(item: DashboardNavItem, pathname: string) {
  if (pathname === item.href) return true;
  return !item.exact && pathname.startsWith(`${item.href}/`);
}

export function getDashboardRouteMeta(pathname: string, role: DashboardRole) {
  const uiMeta = dashboardRoleUiConfig[resolveOpsRole(role)];
  const matchedItem = getDashboardNav(role).find((item) =>
    isDashboardNavItemActive(item, pathname),
  );
  return {
    eyebrow: uiMeta.eyebrow,
    title: matchedItem?.label ?? uiMeta.defaultTitle,
    subtitle: matchedItem?.description ?? uiMeta.defaultSubtitle,
  };
}
