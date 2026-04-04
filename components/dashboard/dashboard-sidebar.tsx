"use client";

import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import type { ComponentType } from "react";
import { usePathname } from "next/navigation";

import {
  getDashboardNav,
  isDashboardNavItemActive,
  type DashboardRole,
} from "@/lib/navigation/dashboard-nav";
import { cn } from "@/lib/utils";

type DashboardSidebarProps = {
  role: DashboardRole;
  isOpen: boolean;
  onClose: () => void;
};

const sectionLabels: Record<"primary" | "secondary", string> = {
  primary: "Workspace",
  secondary: "Account",
};

export function DashboardSidebar({
  role,
  isOpen,
  onClose,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const navItems = getDashboardNav(role);
  const groupedItems = {
    primary: navItems.filter((item) => item.section === "primary"),
    secondary: navItems.filter((item) => item.section === "secondary"),
  };

  return (
    <aside
      className="dashboard-sidebar"
      data-open={isOpen}
      aria-label={`${role} portal navigation`}
    >
      <div className="dashboard-sidebar__brand">
        <span className="dashboard-sidebar__brand-mark">
          <Image
            src="/img/Logo-2.png"
            alt="Marvel's Studios"
            width={36}
            height={36}
            priority
            className="dashboard-sidebar__brand-image"
          />
        </span>

        <div className="dashboard-sidebar__brand-copy">
          <p>Marvel Fitness Studio</p>
          <strong>{role} portal</strong>
        </div>

        <button
          type="button"
          className="dashboard-sidebar__close"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>

      {(
        Object.entries(groupedItems) as Array<
          ["primary" | "secondary", typeof groupedItems.primary]
        >
      ).map(([section, items]) => (
        <div key={section} className="dashboard-sidebar__section">
          <div className="dashboard-sidebar__section-label">
            {sectionLabels[section]}
          </div>

          <nav className="dashboard-sidebar__nav" aria-label={sectionLabels[section]}>
            {items.map((item) => {
              const Icon = item.icon as ComponentType<{ size?: number }>;

              if (!item.available) {
                return (
                  <div key={item.href} className="dashboard-sidebar__link--muted">
                    <span className="dashboard-sidebar__icon">
                      <Icon size={18} />
                    </span>
                    <span className="dashboard-sidebar__item-copy">
                      <span>{item.label}</span>
                      <small>{item.description}</small>
                    </span>
                    <span className="dashboard-badge">{item.badge}</span>
                  </div>
                );
              }

              const isActive = isDashboardNavItemActive(item, pathname);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "dashboard-sidebar__link",
                    isActive && "dashboard-sidebar__link--active"
                  )}
                  aria-current={isActive ? "page" : undefined}
                  onClick={onClose}
                >
                  <span className="dashboard-sidebar__icon">
                    <Icon size={18} />
                  </span>
                  <span className="dashboard-sidebar__item-copy">
                    <span>{item.label}</span>
                    <small>{item.description}</small>
                  </span>
                  {item.badge ? (
                    <span className="dashboard-badge">{item.badge}</span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>
      ))}

      <div className="dashboard-sidebar__footnote">
        <span className="dashboard-badge dashboard-badge--accent">
          Frontend phase
        </span>
        <strong>Mock data, real structure.</strong>
        <p>
          This shell is ready for the admin, coach, and client workspaces while
          backend logic remains intentionally postponed.
        </p>
      </div>
    </aside>
  );
}
