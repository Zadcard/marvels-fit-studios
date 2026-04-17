"use client";

import Link from "next/link";
import { LoaderCircle, LogOut, X } from "lucide-react";
import type { ComponentType } from "react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

import {
  getDashboardNav,
  getDashboardProfileMeta,
  getDashboardRoleLabel,
  isDashboardNavItemActive,
} from "@/lib/navigation/dashboard-nav";
import type { DashboardRole } from "@/lib/auth/authorization-policy";
import { BrandLockup } from "@/components/ui/brand-lockup";
import { StatusPill } from "@/components/ui/status-pill";
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
  const { data: session } = useSession();
  const navItems = getDashboardNav(role);
  const profileMeta = getDashboardProfileMeta(role);
  const roleLabel = getDashboardRoleLabel(role);
  const groupedItems = {
    primary: navItems.filter((item) => item.section === "primary"),
    secondary: navItems.filter((item) => item.section === "secondary"),
  };
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");

  const displayName =
    session?.user?.name?.trim() ||
    session?.user?.email?.trim() ||
    profileMeta.name;
  const displaySubtitle =
    session?.user?.email?.trim() ||
    profileMeta.subtitle;

  async function handleSignOut() {
    setSignOutError("");
    setIsSigningOut(true);

    try {
      await signOut({ redirectTo: "/login" });
    } catch {
      setSignOutError("Sign out failed. Try again.");
      setIsSigningOut(false);
    }
  }

  return (
    <aside
      className="dashboard-sidebar"
      data-open={isOpen}
      aria-label={`${role} portal navigation`}
    >
      <div className="dashboard-sidebar__brand">
        <BrandLockup
          className="min-w-0 flex-1"
          eyebrow="Premium performance training"
          contextLabel={`${roleLabel} workspace`}
          priority
          imageAlt="Marvel's Fit Studios logo"
        />

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

      <div className="dashboard-sidebar__account">
        <div className="dashboard-sidebar__account-copy">
          <StatusPill tone="accent">{roleLabel}</StatusPill>
          <strong>{displayName}</strong>
          <p>{displaySubtitle}</p>
        </div>

        <button
          type="button"
          className="dashboard-sidebar__logout"
          onClick={handleSignOut}
          disabled={isSigningOut}
        >
          {isSigningOut ? (
            <LoaderCircle size={16} className="animate-spin-slow" />
          ) : (
            <LogOut size={16} />
          )}
          {isSigningOut ? "Signing out" : "Log out"}
        </button>

        {signOutError ? (
          <p className="dashboard-sidebar__account-error" role="alert">
            {signOutError}
          </p>
        ) : null}
      </div>
    </aside>
  );
}
