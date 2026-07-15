"use client";

import Link from "next/link";
import { Bell, Menu, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

import type { DashboardAccountSummary } from "@/components/dashboard/dashboard-role-shell";
import { BrandLockup } from "@/components/ui/brand-lockup";
import type { DashboardRole } from "@/lib/auth/authorization-policy";
import {
  getDashboardNav,
  getDashboardProfileHref,
  getDashboardProfileMeta,
  getDashboardRoleLabel,
  isDashboardNavItemActive,
} from "@/lib/navigation/dashboard-nav";
import { getInitials } from "@/lib/utils";

type DashboardTopbarProps = {
  role: DashboardRole;
  account?: DashboardAccountSummary;
  isMenuOpen: boolean;
  onOpenMenu: () => void;
};

export function DashboardTopbar({ role, account, isMenuOpen, onOpenMenu }: DashboardTopbarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const roleLabel = getDashboardRoleLabel(role);
  const fallback = getDashboardProfileMeta(role);
  const navItems = getDashboardNav(role).filter(
    (item) => item.section === "primary" && item.available && !item.hidden,
  );
  const displayName = account?.name?.trim() || session?.user?.name?.trim() || fallback.name;
  const displayInitials = account?.initials?.trim() || getInitials(displayName) || fallback.initials;

  return (
    <header className="redline-topbar">
      <div className="redline-brand">
        <button
          type="button"
          className="redline-mobile-menu"
          aria-label="Open navigation"
          aria-expanded={isMenuOpen}
          onClick={onOpenMenu}
        >
          <Menu size={19} />
        </button>
        <Link href={`/${role}`} aria-label={`${roleLabel} home`}>
          <BrandLockup size="compact" priority />
        </Link>
      </div>

      <nav className="redline-primary-nav" aria-label={`${roleLabel} primary navigation`}>
        {navItems.map((item) => {
          const active = isDashboardNavItemActive(item, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="redline-primary-link"
              data-active={active || undefined}
              aria-current={active ? "page" : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="redline-utilities">
        <button type="button" className="redline-utility redline-search-trigger" aria-label="Open search">
          <Search size={18} />
          <span>Search</span>
          <kbd>⌘ K</kbd>
        </button>
        <Link href={`/${role}/notifications`} className="redline-utility redline-utility--icon" aria-label="Notifications">
          <Bell size={18} />
          <span className="redline-alert-dot" aria-hidden="true" />
        </Link>
        <Link href={getDashboardProfileHref(role)} className="redline-account" aria-label="Open account">
          <span className="redline-avatar">{displayInitials}</span>
          <span><strong>{displayName}</strong><small>{roleLabel}</small></span>
        </Link>
      </div>
    </header>
  );
}
