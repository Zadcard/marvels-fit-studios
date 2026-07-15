"use client";

import Link from "next/link";
import { Bell, Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

import {
  getDashboardProfileMeta,
  getDashboardProfileHref,
  getDashboardRouteMeta,
  getDashboardRoleLabel,
} from "@/lib/navigation/dashboard-nav";
import type { DashboardRole } from "@/lib/auth/authorization-policy";
import type { DashboardAccountSummary } from "@/components/dashboard/dashboard-role-shell";
import { getInitials } from "@/lib/utils";

type DashboardTopbarProps = {
  role: DashboardRole;
  account?: DashboardAccountSummary;
  activePath?: string;
  onMenuToggle: () => void;
  isMenuOpen?: boolean;
};

export function DashboardTopbar({
  role,
  account,
  activePath,
  onMenuToggle,
  isMenuOpen = false,
}: DashboardTopbarProps) {
  const pathname = usePathname();
  const currentPath = activePath ?? pathname;
  const { data: session } = useSession();
  const routeMeta = getDashboardRouteMeta(currentPath, role);
  const profileMeta = getDashboardProfileMeta(role);
  const roleLabel = getDashboardRoleLabel(role);
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
    account?.initials?.trim() || getInitials(displayName);

  return (
    <header className="dashboard-topbar">
      <div className="dashboard-topbar__left">
        <button
          type="button"
          className="dashboard-menu-toggle"
          onClick={onMenuToggle}
          aria-label="Open navigation"
          aria-expanded={isMenuOpen}
          aria-controls="dashboard-navigation"
        >
          <Menu size={20} />
        </button>

        <div className="dashboard-topbar__meta">
          <span className="mv-eyebrow">{routeMeta.eyebrow}</span>
          <h1 className="dashboard-topbar__title">{routeMeta.title}</h1>
          <p className="dashboard-topbar__subtitle">{routeMeta.subtitle}</p>
        </div>
      </div>

      <div className="dashboard-topbar__right">
        <Link
          href={`/${role.toLowerCase()}/notifications`}
          className="mv-btn mv-btn-outline"
          aria-label="Open notifications"
        >
          <Bell size={17} />
          Notifications
        </Link>
        <Link href={getDashboardProfileHref(role)} className="dashboard-topbar__profile">
          <span className="dashboard-topbar__avatar">
            {displayInitials || profileMeta.initials}
          </span>
          <span className="dashboard-topbar__profile-copy">
            <strong>{displayName}</strong>
            <small className="dashboard-topbar__profile-status">
              <span>{displaySubtitle}</span>
              <span className="dashboard-topbar__profile-separator" aria-hidden="true">
                /
              </span>
              <span>{roleLabel}</span>
            </small>
          </span>
        </Link>
      </div>
    </header>
  );
}
