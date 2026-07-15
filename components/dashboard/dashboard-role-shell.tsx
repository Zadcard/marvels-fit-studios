"use client";

import { useState } from "react";
import { Dialog } from "radix-ui";

import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";
import { cn } from "@/lib/utils";
import type { DashboardRole } from "@/lib/auth/authorization-policy";

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

export function DashboardRoleShell({
  role,
  account,
  children,
}: DashboardRoleShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <Dialog.Root open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
      <div className={cn("dashboard-shell", `dashboard-shell--${role}`)}>
        <div className="dashboard-app-frame">
          <DashboardTopbar
            role={role}
            account={account}
            isMenuOpen={isSidebarOpen}
            onOpenMenu={() => setIsSidebarOpen(true)}
          />

          <div className="dashboard-grid">
            <DashboardSidebar
              role={role}
              account={account}
              onClose={closeSidebar}
            />

            <div className="dashboard-main">
              <main className="dashboard-content">{children}</main>
            </div>
          </div>
        </div>
      </div>
    </Dialog.Root>
  );
}
