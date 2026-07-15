"use client";

import { useState } from "react";
import { Dialog } from "radix-ui";

import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";
import type { DashboardRole } from "@/lib/auth/authorization-policy";
import "@/app/(dashboard)/redline-shell.css";

export type DashboardAccountSummary = {
  name?: string | null;
  subtitle?: string | null;
  initials?: string | null;
};

type DashboardRoleShellProps = {
  role: DashboardRole;
  account?: DashboardAccountSummary;
  children: React.ReactNode;
};

export function DashboardRoleShell({ role, account, children }: DashboardRoleShellProps) {
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);

  return (
    <Dialog.Root open={isNavigationOpen} onOpenChange={setIsNavigationOpen}>
      <div className="redline-viewport">
        <div className="redline-frame">
          <DashboardTopbar
            role={role}
            account={account}
            isMenuOpen={isNavigationOpen}
            onOpenMenu={() => setIsNavigationOpen(true)}
          />
          <div className="redline-workspace">
            <DashboardSidebar
              role={role}
              account={account}
              onClose={() => setIsNavigationOpen(false)}
            />
            <main className="redline-content" id="main-content">{children}</main>
          </div>
        </div>
      </div>
    </Dialog.Root>
  );
}
