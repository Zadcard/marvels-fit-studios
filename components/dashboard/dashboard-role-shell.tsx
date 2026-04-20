"use client";

import { useEffect, useState } from "react";

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

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("dashboard-nav-open", isSidebarOpen);
    return () => document.body.classList.remove("dashboard-nav-open");
  }, [isSidebarOpen]);

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="dashboard-shell">
      <button
        type="button"
        aria-label="Close navigation"
        className={cn(
          "dashboard-sidebar-backdrop",
          isSidebarOpen && "dashboard-sidebar-backdrop--visible"
        )}
        onClick={closeSidebar}
      />

      <div className="dashboard-grid">
        <DashboardSidebar
          role={role}
          account={account}
          isOpen={isSidebarOpen}
          onClose={closeSidebar}
        />

        <div className="dashboard-main">
          <DashboardTopbar
            role={role}
            account={account}
            onMenuToggle={() => setIsSidebarOpen((open) => !open)}
          />
          <main className="dashboard-content">{children}</main>
        </div>
      </div>
    </div>
  );
}
