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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

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

  return (
    <div className="dashboard-shell">
      <button
        type="button"
        aria-label="Close navigation"
        className={cn(
          "dashboard-sidebar-backdrop",
          isSidebarOpen && "dashboard-sidebar-backdrop--visible"
        )}
        onClick={() => setIsSidebarOpen(false)}
      />

      <div className="dashboard-grid">
        <DashboardSidebar
          role={role}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <div className="dashboard-main">
          <DashboardTopbar
            role={role}
            onMenuToggle={() => setIsSidebarOpen((open) => !open)}
          />
          <main className="dashboard-content">{children}</main>
        </div>
      </div>
    </div>
  );
}
