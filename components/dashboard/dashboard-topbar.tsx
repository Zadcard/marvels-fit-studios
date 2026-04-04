"use client";

import Link from "next/link";
import { Bell, Menu, Search } from "lucide-react";
import { usePathname } from "next/navigation";

import {
  getDashboardProfileMeta,
  getDashboardProfileHref,
  getDashboardRouteMeta,
  getDashboardSearchPrompt,
} from "@/lib/navigation/dashboard-nav";
import type { DashboardRole } from "@/lib/auth/authorization-policy";

type DashboardTopbarProps = {
  role: DashboardRole;
  onMenuToggle: () => void;
};

export function DashboardTopbar({
  role,
  onMenuToggle,
}: DashboardTopbarProps) {
  const pathname = usePathname();
  const routeMeta = getDashboardRouteMeta(pathname, role);
  const profileMeta = getDashboardProfileMeta(role);

  return (
    <header className="dashboard-topbar">
      <div className="dashboard-topbar__left">
        <button
          type="button"
          className="dashboard-menu-toggle"
          onClick={onMenuToggle}
          aria-label="Open navigation"
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
        <div className="dashboard-topbar__search" role="note" aria-label="Search preview">
          <Search size={16} />
          <span>{getDashboardSearchPrompt(role)}</span>
        </div>

        <Link href={getDashboardProfileHref(role)} className="dashboard-topbar__profile">
          <span className="dashboard-topbar__avatar">{profileMeta.initials}</span>
          <span className="dashboard-topbar__profile-copy">
            <strong>{profileMeta.name}</strong>
            <small className="dashboard-topbar__profile-status">
              <span>{profileMeta.subtitle}</span>
              <Bell size={12} aria-hidden="true" />
            </small>
          </span>
        </Link>
      </div>
    </header>
  );
}
