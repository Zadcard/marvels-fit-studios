"use client";

import type { ComponentType } from "react";
import { useState } from "react";
import Link from "next/link";
import { LoaderCircle, LogOut, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Dialog } from "radix-ui";

import type { DashboardAccountSummary } from "@/components/dashboard/dashboard-role-shell";
import { BrandLockup } from "@/components/ui/brand-lockup";
import { StatusBadge } from "@/components/ui/status-badge";
import type { DashboardRole } from "@/lib/auth/authorization-policy";
import {
  getDashboardNav,
  getDashboardProfileMeta,
  getDashboardRoleLabel,
  isDashboardNavItemActive,
} from "@/lib/navigation/dashboard-nav";
import { cn } from "@/lib/utils";

type DashboardSidebarProps = {
  role: DashboardRole;
  account?: DashboardAccountSummary;
  onClose: () => void;
};

const sectionLabels = {
  primary: "Workspace",
  secondary: "Account",
} as const;

export function DashboardSidebar({
  role,
  account,
  onClose,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const navItems = getDashboardNav(role).filter((item) => item.available);
  const profileMeta = getDashboardProfileMeta(role);
  const roleLabel = getDashboardRoleLabel(role);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const displayName =
    account?.name?.trim() ||
    session?.user?.name?.trim() ||
    session?.user?.email?.trim() ||
    profileMeta.name;
  const displaySubtitle =
    account?.subtitle?.trim() ||
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

  function renderLink(
    item: (typeof navItems)[number],
    compact: boolean,
  ) {
    const Icon = item.icon as ComponentType<{ size?: number; strokeWidth?: number }>;
    const active = isDashboardNavItemActive(item, pathname);

    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          compact ? "dashboard-rail__link" : "dashboard-drawer__link",
          active && (compact ? "dashboard-rail__link--active" : "dashboard-drawer__link--active"),
        )}
        aria-label={compact ? item.label : undefined}
        aria-current={active ? "page" : undefined}
        title={compact ? item.label : undefined}
        onClick={onClose}
      >
        <span className={compact ? "dashboard-rail__icon" : "dashboard-drawer__icon"}>
          <Icon size={18} strokeWidth={2.1} />
        </span>
        {compact ? null : (
          <span className="dashboard-drawer__link-copy">
            <strong>{item.label}</strong>
            <small>{item.description}</small>
          </span>
        )}
        {!compact && item.badge ? (
          <span className="dashboard-badge">{item.badge}</span>
        ) : null}
      </Link>
    );
  }

  return (
    <>
      <aside className="dashboard-rail" aria-label={`${roleLabel} quick navigation`}>
        <nav className="dashboard-rail__nav">
          {navItems.map((item) => renderLink(item, true))}
        </nav>
        <div className="dashboard-rail__footer">
          <button
            type="button"
            className="dashboard-rail__link"
            onClick={handleSignOut}
            disabled={isSigningOut}
            aria-label={isSigningOut ? "Signing out" : "Log out"}
            title={isSigningOut ? "Signing out" : "Log out"}
          >
            <span className="dashboard-rail__icon">
              {isSigningOut ? (
                <LoaderCircle size={18} className="animate-spin-slow" />
              ) : (
                <LogOut size={18} />
              )}
            </span>
          </button>
          {signOutError ? (
            <span className="dashboard-rail__signout-error" role="alert">
              {signOutError}
            </span>
          ) : null}
        </div>
      </aside>

      <Dialog.Portal>
        <Dialog.Overlay className="dashboard-drawer-overlay" />
        <Dialog.Content className="dashboard-drawer">
          <Dialog.Title className="sr-only">{roleLabel} navigation</Dialog.Title>
          <Dialog.Description className="sr-only">
            Navigate the Marvel&apos;s Fit Studios {roleLabel.toLowerCase()} workspace.
          </Dialog.Description>

          <header className="dashboard-drawer__header">
            <BrandLockup
              size="compact"
              contextLabel={roleLabel}
              contextTone="neutral"
              priority
            />
            <Dialog.Close asChild>
              <button
                type="button"
                className="dashboard-drawer__close"
                aria-label="Close navigation"
              >
                <X size={19} />
              </button>
            </Dialog.Close>
          </header>

          <div className="dashboard-drawer__body">
            {(["primary", "secondary"] as const).map((section) => {
              const items = navItems.filter((item) => item.section === section);
              if (!items.length) return null;

              return (
                <section className="dashboard-drawer__section" key={section}>
                  <span className="dashboard-drawer__section-label">
                    {sectionLabels[section]}
                  </span>
                  <nav aria-label={sectionLabels[section]}>
                    {items.map((item) => renderLink(item, false))}
                  </nav>
                </section>
              );
            })}
          </div>

          <footer className="dashboard-drawer__account">
            <div>
              <StatusBadge tone="brand">{roleLabel}</StatusBadge>
              <strong>{displayName}</strong>
              <p>{displaySubtitle}</p>
            </div>
            <button
              type="button"
              className="mv-btn mv-btn-secondary"
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
              <p className="dashboard-drawer__error" role="alert">
                {signOutError}
              </p>
            ) : null}
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </>
  );
}
