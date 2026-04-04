"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";
import { getDashboardRoleFromPath } from "@/lib/navigation/dashboard-nav";
import { cn } from "@/lib/utils";

import "./dashboard-shell.css";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const role = getDashboardRoleFromPath(pathname);
  const [sidebarState, setSidebarState] = useState({
    isOpen: false,
    pathname,
  });
  const isSidebarOpen =
    sidebarState.pathname === pathname ? sidebarState.isOpen : false;

  const closeSidebar = () => {
    setSidebarState({ isOpen: false, pathname });
  };

  const toggleSidebar = () => {
    setSidebarState((current) => ({
      pathname,
      isOpen: current.pathname === pathname ? !current.isOpen : true,
    }));
  };

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSidebarState({ isOpen: false, pathname });
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [pathname]);

  useEffect(() => {
    document.body.classList.toggle("dashboard-nav-open", isSidebarOpen);
    return () => document.body.classList.remove("dashboard-nav-open");
  }, [isSidebarOpen]);

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
          isOpen={isSidebarOpen}
          onClose={closeSidebar}
        />

        <div className="dashboard-main">
          <DashboardTopbar
            role={role}
            onMenuToggle={toggleSidebar}
          />
          <main className="dashboard-content">{children}</main>
        </div>
      </div>
    </div>
  );
}
