"use client";

import type { ComponentType } from "react";
import { useState } from "react";
import Link from "next/link";
import { LoaderCircle, LogOut, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Dialog } from "radix-ui";

import type { DashboardAccountSummary } from "@/components/dashboard/dashboard-role-shell";
import { BrandLockup } from "@/components/ui/brand-lockup";
import type { DashboardRole } from "@/lib/auth/authorization-policy";
import { getDashboardNav, getDashboardRoleLabel, isDashboardNavItemActive } from "@/lib/navigation/dashboard-nav";

type DashboardSidebarProps = {
  role: DashboardRole;
  account?: DashboardAccountSummary;
  onClose: () => void;
};

export function DashboardSidebar({ role, account, onClose }: DashboardSidebarProps) {
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

  function NavLink({ item, expanded = false }: { item: (typeof navItems)[number]; expanded?: boolean }) {
    const Icon = item.icon as ComponentType<{ size?: number; strokeWidth?: number }>;
    const active = isDashboardNavItemActive(item, pathname);
    return (
      <Link
        href={item.href}
        className={expanded ? "redline-drawer-link" : "redline-rail-link"}
        data-active={active || undefined}
        aria-current={active ? "page" : undefined}
        aria-label={expanded ? undefined : item.label}
        title={expanded ? undefined : item.label}
        onClick={onClose}
      >
        <Icon size={18} strokeWidth={2} />
        {expanded ? <span><strong>{item.label}</strong><small>{item.description}</small></span> : null}
      </Link>
    );
  }

  return (
    <>
      <aside className="redline-rail" aria-label={`${roleLabel} navigation`}>
        <span className="redline-rail-label">MFS</span>
        <nav>{navItems.map((item) => <NavLink key={item.href} item={item} />)}</nav>
        <button type="button" className="redline-rail-link" onClick={handleSignOut} disabled={isSigningOut} aria-label="Log out">
          {isSigningOut ? <LoaderCircle size={18} className="animate-spin-slow" /> : <LogOut size={18} />}
        </button>
      </aside>

      <Dialog.Portal>
        <Dialog.Overlay className="redline-drawer-overlay" />
        <Dialog.Content className="redline-drawer">
          <Dialog.Title className="sr-only">{roleLabel} navigation</Dialog.Title>
          <Dialog.Description className="sr-only">Navigate the Marvel&apos;s Fit Studios workspace.</Dialog.Description>
          <div className="redline-drawer-header">
            <BrandLockup size="compact" />
            <Dialog.Close asChild>
              <button type="button" className="redline-utility redline-utility--icon" aria-label="Close navigation"><X size={18} /></button>
            </Dialog.Close>
          </div>
          <nav className="redline-drawer-nav">{navItems.map((item) => <NavLink key={item.href} item={item} expanded />)}</nav>
          <footer className="redline-drawer-footer">
            <div><strong>{account?.name || roleLabel}</strong><small>{account?.subtitle || `${roleLabel} workspace`}</small></div>
            <button type="button" className="mv-btn mv-btn-primary" onClick={handleSignOut} disabled={isSigningOut}>
              {isSigningOut ? <LoaderCircle size={17} className="animate-spin-slow" /> : <LogOut size={17} />} Log out
            </button>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </>
  );
}
