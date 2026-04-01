"use client";

import { Bell, Menu, Search } from "lucide-react";
import { usePathname } from "next/navigation";

import {
  getDashboardRoleLabel,
  getDashboardRouteMeta,
  type DashboardRole,
} from "@/lib/navigation/dashboard-nav";

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
        <button type="button" className="dashboard-topbar__search">
          <Search size={16} />
          <span>Search members, sessions, or coaches</span>
        </button>

        <button type="button" className="dashboard-topbar__profile">
          <span className="dashboard-topbar__avatar">MS</span>
          <span className="dashboard-topbar__profile-copy">
            <strong>{getDashboardRoleLabel(role)}</strong>
            <small>
              Mock mode <Bell size={12} style={{ marginLeft: 6 }} />
            </small>
          </span>
        </button>
      </div>
    </header>
  );
}
