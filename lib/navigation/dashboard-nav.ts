import type { LucideIcon } from "lucide-react";
import { Bell, CalendarClock, CalendarDays, CalendarRange, ChartNoAxesCombined, ClipboardCheck, ClipboardList, CreditCard, LayoutDashboard, Settings, ShieldAlert, ShieldUser, Users, UsersRound } from "lucide-react";

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
type DashboardRoleUiMeta = { label: string; defaultTitle: string; defaultSubtitle: string; eyebrow: string; profile: DashboardProfileMeta; searchPrompt: string; profileHref: string };
type OpsRole = Exclude<DashboardRole, "client">;

const dashboardNavConfig: Record<OpsRole, DashboardNavItem[]> = {
  admin: [
    { label: "Today", href: "/admin", icon: LayoutDashboard, description: "Who's on the floor", section: "primary", available: true, exact: true },
    { label: "Attendance", href: "/admin/attendance", icon: ClipboardCheck, description: "Mark check-ins fast", section: "primary", available: true },
    { label: "Schedule", href: "/admin/schedule", icon: CalendarRange, description: "Recurring & changes", section: "primary", available: true },
    { label: "Leads & Trials", href: "/admin/join-requests", icon: ClipboardList, description: "Follow-up pipeline", section: "primary", available: true },
    { label: "Clients", href: "/admin/clients", icon: Users, description: "Roster & profiles", section: "primary", available: true },
    { label: "Groups", href: "/admin/groups", icon: UsersRound, description: "Recurring classes", section: "primary", available: true },
    { label: "Coaches", href: "/admin/coaches", icon: ShieldUser, description: "Load & free slots", section: "primary", available: true },
    { label: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard, description: "Renewals & cash flow", section: "secondary", available: true },
    { label: "Reports", href: "/admin/reports", icon: ChartNoAxesCombined, description: "Revenue & performance", section: "secondary", available: true },
    { label: "Notifications", href: "/admin/notifications", icon: Bell, description: "Studio alerts", section: "secondary", available: true },
    { label: "Settings", href: "/admin/settings", icon: Settings, description: "Studio configuration", section: "secondary", available: true },
  ],
  coach: [
    { label: "Today", href: "/coach", icon: LayoutDashboard, description: "My sessions today", section: "primary", available: true, exact: true },
    { label: "Schedule", href: "/coach/schedule", icon: CalendarDays, description: "My week", section: "primary", available: true },
    { label: "Clients", href: "/coach/clients", icon: Users, description: "My roster", section: "primary", available: true },
    { label: "Alerts", href: "/coach/alerts", icon: ShieldAlert, description: "Injuries & changes", section: "primary", available: true },
    { label: "On my phone", href: "/coach/sessions", icon: CalendarClock, description: "Coach mobile view", section: "primary", available: true },
  ],
};

const dashboardRoleUiConfig: Record<OpsRole, DashboardRoleUiMeta> = {
  admin: { label: "Admin", defaultTitle: "Today", defaultSubtitle: "Live studio operations.", eyebrow: "Operations", profile: { name: "Admin account", subtitle: "Studio admin", initials: "AD" }, searchPrompt: "Search clients, coaches, sessions…", profileHref: "/admin" },
  coach: { label: "Coach", defaultTitle: "Today", defaultSubtitle: "My sessions and injury context.", eyebrow: "Coach", profile: { name: "Coach account", subtitle: "Coach workspace", initials: "CO" }, searchPrompt: "Search clients or sessions…", profileHref: "/coach" },
};

function resolveOpsRole(role: DashboardRole): OpsRole { return role === "client" ? "coach" : role; }

export function getDashboardRoleLabel(role: DashboardRole) { return role === "client" ? "Unavailable" : dashboardRoleUiConfig[role].label; }
export function getDashboardProfileMeta(role: DashboardRole): DashboardProfileMeta { return dashboardRoleUiConfig[resolveOpsRole(role)].profile; }
export function getDashboardSearchPrompt(role: DashboardRole) { return dashboardRoleUiConfig[resolveOpsRole(role)].searchPrompt; }
export function getDashboardProfileHref(role: DashboardRole) { return dashboardRoleUiConfig[resolveOpsRole(role)].profileHref; }
export function getDashboardNav(role: DashboardRole) { return role === "client" ? [] : dashboardNavConfig[role]; }
export function getDashboardSidebarNav(role: DashboardRole) { return getDashboardNav(role); }

export function isDashboardNavItemActive(item: DashboardNavItem, pathname: string) {
  if (pathname === item.href) return true;
  return !item.exact && pathname.startsWith(`${item.href}/`);
}

export function getDashboardRouteMeta(pathname: string, role: DashboardRole) {
  const uiMeta = dashboardRoleUiConfig[resolveOpsRole(role)];
  const matchedItem = getDashboardNav(role).find((item) => isDashboardNavItemActive(item, pathname));
  return { eyebrow: uiMeta.eyebrow, title: matchedItem?.label ?? uiMeta.defaultTitle, subtitle: matchedItem?.description ?? uiMeta.defaultSubtitle };
}
