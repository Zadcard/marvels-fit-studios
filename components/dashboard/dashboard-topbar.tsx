"use client";

import Link from "next/link";
import { Bell, Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Dialog } from "radix-ui";

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
import { cn, getInitials } from "@/lib/utils";

type DashboardTopbarProps = {
  role: DashboardRole;
  account?: DashboardAccountSummary;
  isMenuOpen: boolean;
};

export function DashboardTopbar({
  role,
  account,
  isMenuOpen,
}: DashboardTopbarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const profileMeta = getDashboardProfileMeta(role);
  const roleLabel = getDashboardRoleLabel(role);
  const primaryNav = getDashboardNav(role).filter(
    (item) => item.section === "primary" && item.available && !item.hidden,
  );
  const displayName =
    account?.name?.trim() ||
    session?.user?.name?.trim() ||
    session?.user?.email?.trim() ||
    profileMeta.name;
  const displaySubtitle =
    account?.subtitle?.trim() ||
    session?.user?.email?.trim() ||
    profileMeta.subtitle;
  const displayInitials =
    account?.initials?.trim() || getInitials(displayName) || profileMeta.initials;

  return (
    <header className="dashboard-topbar">
      <div className="dashboard-topbar__brand-row">
        <Dialog.Trigger asChild>
          <button
            type="button"
            className="dashboard-menu-toggle"
            aria-label="Open navigation"
            aria-expanded={isMenuOpen}
          >
            <Menu size={20} />
          </button>
        </Dialog.Trigger>

        <Link href={`/${role}`} aria-label={`${roleLabel} dashboard`}>
          <BrandLockup
            size="compact"
            contextLabel={roleLabel}
            contextTone="neutral"
            priority
          />
        </Link>
      </div>

      <nav className="dashboard-topbar__nav" aria-label={`${roleLabel} primary navigation`}>
        {primaryNav.map((item) => {
          const active = isDashboardNavItemActive(item, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "dashboard-topbar__nav-link",
                active && "dashboard-topbar__nav-link--active",
              )}
              aria-current={active ? "page" : undefined}
            >
              <span aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="dashboard-topbar__right">
        <Link
          href={`/${role}/notifications`}
          className="dashboard-topbar__action"
          aria-label="Open notifications"
        >
          <Bell size={18} />
          <span className="dashboard-topbar__notification-dot" aria-hidden="true" />
        </Link>

        <Link href={getDashboardProfileHref(role)} className="dashboard-topbar__profile">
          <span className="dashboard-topbar__avatar">{displayInitials}</span>
          <span className="dashboard-topbar__profile-copy">
            <strong>{displayName}</strong>
            <small>
              <span className="truncate">{displaySubtitle}</span>
              <span aria-hidden="true">·</span>
              <span>{roleLabel}</span>
            </small>
          </span>
        </Link>
      </div>
    </header>
  );
}
