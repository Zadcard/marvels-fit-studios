"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { DashboardScheduleTopnav } from "@/components/dashboard/dashboard-schedule-topnav";
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
  previewPath?: string;
  children: React.ReactNode;
};

export function DashboardRoleShell({
  role,
  account,
  previewPath,
  children,
}: DashboardRoleShellProps) {
  const pathname = usePathname();
  const activePath = previewPath ?? pathname;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const usesScheduleTopnav =
    role === "admin" && activePath.startsWith("/admin/schedule");
  const isAdminOverview = role === "admin" && activePath === "/admin";

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
    <div
      className={cn(
        "dashboard-shell",
        usesScheduleTopnav && "dashboard-shell--schedule-topnav",
        isAdminOverview && "dashboard-shell--admin-overview",
      )}
    >
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
          activePath={activePath}
          isOpen={isSidebarOpen}
          onClose={closeSidebar}
        />

        <div className="dashboard-main">
          {usesScheduleTopnav ? (
            <DashboardScheduleTopnav
              account={account}
              activePath={activePath}
              onMenuToggle={() => setIsSidebarOpen((open) => !open)}
              isMenuOpen={isSidebarOpen}
            />
          ) : isAdminOverview ? null : (
            <DashboardTopbar
              role={role}
              account={account}
              activePath={activePath}
              onMenuToggle={() => setIsSidebarOpen((open) => !open)}
              isMenuOpen={isSidebarOpen}
            />
          )}
          <main className="dashboard-content">{children}</main>
        </div>
      </div>
    </div>
  );
}
