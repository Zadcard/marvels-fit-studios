"use client";

/* The panel deliberately shares current sidebar state between desktop and Dialog markup. */
/* eslint-disable react-hooks/static-components */

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ComponentType } from "react";
import { LoaderCircle, LogOut, X } from "lucide-react";
import { signOut } from "next-auth/react";
import { Dialog } from "radix-ui";

import type { DashboardAccountSummary } from "@/components/dashboard/dashboard-role-shell";
import type { DashboardRole } from "@/lib/auth/authorization-policy";
import {
  getDashboardNav,
  getDashboardRoleLabel,
  isDashboardNavItemActive,
} from "@/lib/navigation/dashboard-nav";
import brandMark from "@/public/img/Logo-3.png";

type DashboardSidebarProps = {
  role: DashboardRole;
  account?: DashboardAccountSummary;
  navBadges?: Record<string, number>;
  onClose: () => void;
};

type NavItem = ReturnType<typeof getDashboardNav>[number];

const adminSections: Array<{ label: string; matches: (item: NavItem) => boolean }> = [
  {
    label: "Operations",
    matches: (item) => ["/admin", "/admin/attendance", "/admin/schedule"].includes(item.href),
  },
  {
    label: "People",
    matches: (item) => ["/admin/join-requests", "/admin/clients", "/admin/groups", "/admin/categories", "/admin/coaches"].includes(item.href),
  },
  { label: "Money", matches: (item) => ["/admin/subscriptions", "/admin/reports"].includes(item.href) },
  { label: "Studio", matches: (item) => ["/admin/notifications", "/admin/settings"].includes(item.href) },
];

function OpsBrand() {
  return (
    <Link href="/" className="ops-brand" aria-label="Marvel Fit Studios home">
      <Image src={brandMark} alt="" width={42} height={42} priority />
      <span>
        <strong>Marvel Fit Studios</strong>
        <small>6th of October · Ops</small>
      </span>
    </Link>
  );
}

export function DashboardSidebar({ role, account, navBadges, onClose }: DashboardSidebarProps) {
  const pathname = usePathname();
  const roleLabel = getDashboardRoleLabel(role);
  const navItems = getDashboardNav(role).filter((item) => item.available);
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await signOut({ redirectTo: "/login" });
    } catch {
      setIsSigningOut(false);
    }
  }

  function NavLink({ item }: { item: NavItem }) {
    const Icon = item.icon as ComponentType<{ size?: number; strokeWidth?: number }>;
    const active = isDashboardNavItemActive(item, pathname);
    const liveBadge = navBadges?.[item.href];
    const badge = liveBadge ? String(liveBadge) : item.badge;
    return (
      <Link
        href={item.href}
        className="ops-nav-link"
        data-active={active || undefined}
        aria-current={active ? "page" : undefined}
        onClick={onClose}
      >
        <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
        <span>
          <strong>{item.label}</strong>
          <small>{item.description}</small>
        </span>
        {badge ? <b>{badge}</b> : null}
      </Link>
    );
  }

  function SidebarPanel({ mobile = false }: { mobile?: boolean }) {
    return (
      <div className="ops-sidebar-panel">
        <div className="ops-sidebar-head">
          <OpsBrand />
          {mobile ? (
            <Dialog.Close asChild>
              <button type="button" className="ops-icon-button" aria-label="Close navigation">
                <X size={18} />
              </button>
            </Dialog.Close>
          ) : null}
        </div>

        <nav className="ops-nav" aria-label={`${roleLabel} navigation`}>
          {role === "admin"
            ? adminSections.map((section) => {
                const items = navItems.filter(section.matches);
                if (!items.length) return null;
                return (
                  <section key={section.label}>
                    <h2>{section.label}</h2>
                    <div>{items.map((item) => <NavLink key={item.href} item={item} />)}</div>
                  </section>
                );
              })
            : (
              <section>
                <h2>{role === "coach" ? `Coach · ${account?.name || "Workspace"}` : "Client"}</h2>
                <div>{navItems.map((item) => <NavLink key={item.href} item={item} />)}</div>
              </section>
            )}
        </nav>

        <footer className="ops-account-card">
          <span className="ops-account-avatar">{account?.initials || roleLabel.slice(0, 2).toUpperCase()}</span>
          <span>
            <strong>{account?.name || roleLabel}</strong>
            <small>{account?.subtitle || `${roleLabel} workspace`}</small>
          </span>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
            aria-label="Log out"
            title="Log out"
          >
            {isSigningOut ? <LoaderCircle size={15} className="animate-spin-slow" /> : <LogOut size={15} />}
          </button>
        </footer>
      </div>
    );
  }

  return (
    <>
      <aside className="ops-sidebar"><SidebarPanel /></aside>
      <Dialog.Portal>
        <Dialog.Overlay className="ops-drawer-overlay" />
        <Dialog.Content className="ops-drawer">
          <Dialog.Title className="sr-only">{roleLabel} navigation</Dialog.Title>
          <Dialog.Description className="sr-only">Navigate the operations workspace.</Dialog.Description>
          <SidebarPanel mobile />
        </Dialog.Content>
      </Dialog.Portal>
    </>
  );
}
