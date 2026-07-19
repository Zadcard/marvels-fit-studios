"use client";

import { useEffect, useState } from "react";
import { Dialog } from "radix-ui";

import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";
import { DashboardCommandPalette } from "@/components/dashboard/dashboard-command-palette";
import { DashboardToastProvider } from "@/components/dashboard/dashboard-toast-provider";
import type { DashboardRole } from "@/lib/auth/authorization-policy";
import type { DashboardCommandItem } from "@/lib/dashboard/dashboard-command-item";
import "@/app/(dashboard)/redline-shell.css";

export type DashboardAccountSummary = {
  name?: string | null;
  subtitle?: string | null;
  initials?: string | null;
};

type DashboardRoleShellProps = {
  role: DashboardRole;
  account?: DashboardAccountSummary;
  commandItems?: DashboardCommandItem[];
  navBadges?: Record<string, number>;
  children: React.ReactNode;
};

export function DashboardRoleShell({ role, account, commandItems = [], navBadges, children }: DashboardRoleShellProps) {
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  useEffect(() => {
    function openCommandWithShortcut(event: KeyboardEvent) {
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))) return;
      if (event.key === "/" || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k")) {
        event.preventDefault();
        setIsCommandOpen(true);
      }
    }

    window.addEventListener("keydown", openCommandWithShortcut);
    return () => window.removeEventListener("keydown", openCommandWithShortcut);
  }, []);

  return (
    <DashboardToastProvider>
    <Dialog.Root open={isNavigationOpen} onOpenChange={setIsNavigationOpen}>
      <div className="ops-viewport">
        <DashboardSidebar
          role={role}
          account={account}
          navBadges={navBadges}
          onClose={() => setIsNavigationOpen(false)}
        />
        <div className="ops-stage">
          <DashboardTopbar
            role={role}
            isMenuOpen={isNavigationOpen}
            onOpenMenu={() => setIsNavigationOpen(true)}
            onOpenCommand={() => setIsCommandOpen(true)}
          />
          <main className="ops-content" id="main-content">
            {children}
          </main>
        </div>
      </div>
      <DashboardCommandPalette role={role} commandItems={commandItems} open={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
    </Dialog.Root>
    </DashboardToastProvider>
  );
}
