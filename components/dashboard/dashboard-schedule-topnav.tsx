"use client";

import Link from "next/link";
import { Bell, Menu, Search } from "lucide-react";
import { usePathname } from "next/navigation";

import type { DashboardAccountSummary } from "@/components/dashboard/dashboard-role-shell";
import { BrandLockup } from "@/components/ui/brand-lockup";
import {
  getDashboardProfileHref,
  getDashboardSidebarNav,
  isDashboardNavItemActive,
} from "@/lib/navigation/dashboard-nav";
import { cn, getInitials } from "@/lib/utils";

type DashboardScheduleTopnavProps = {
  account?: DashboardAccountSummary;
  activePath?: string;
  onMenuToggle: () => void;
  isMenuOpen?: boolean;
};

export function DashboardScheduleTopnav({
  account,
  activePath,
  onMenuToggle,
  isMenuOpen = false,
}: DashboardScheduleTopnavProps) {
  const pathname = usePathname();
  const currentPath = activePath ?? pathname;
  const navItems = getDashboardSidebarNav("admin").filter(
    (item) => item.section === "primary",
  );
  const displayName = account?.name?.trim() || "Studio admin";
  const initials = account?.initials?.trim() || getInitials(displayName);

  return (
    <header className="dashboard-schedule-topnav">
      <div className="dashboard-schedule-topnav__brand">
        <button
          type="button"
          className="dashboard-menu-toggle"
          onClick={onMenuToggle}
          aria-label="Open navigation"
          aria-expanded={isMenuOpen}
          aria-controls="dashboard-navigation"
        >
          <Menu size={19} />
        </button>
        <Link href="/admin" aria-label="Marvel Fit admin dashboard">
          <BrandLockup title="Marvel Fit" size="compact" priority />
        </Link>
      </div>

      <nav className="dashboard-schedule-topnav__nav" aria-label="Admin workspace">
        {navItems.map((item) => {
          const active = isDashboardNavItemActive(item, currentPath);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "dashboard-schedule-topnav__link",
                active && "dashboard-schedule-topnav__link--active",
              )}
              aria-current={active ? "page" : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="dashboard-schedule-topnav__tools">
        <div className="dashboard-schedule-topnav__search" aria-hidden="true">
          <Search size={17} />
          <span>Search sessions, coaches...</span>
        </div>
        <Link
          href="/admin/notifications"
          className="mv-icon-btn"
          aria-label="Open notifications"
        >
          <Bell size={17} />
        </Link>
        <Link
          href={getDashboardProfileHref("admin")}
          className="dashboard-schedule-topnav__avatar"
          aria-label={`Open profile for ${displayName}`}
        >
          {initials}
        </Link>
      </div>
    </header>
  );
}
