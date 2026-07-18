"use client";

import { useEffect, useState } from "react";
import { Menu, Search } from "lucide-react";
import { usePathname } from "next/navigation";

import type { DashboardRole } from "@/lib/auth/authorization-policy";
import { getDashboardRouteMeta, getDashboardSearchPrompt } from "@/lib/navigation/dashboard-nav";

type DashboardTopbarProps = {
  role: DashboardRole;
  isMenuOpen: boolean;
  onOpenMenu: () => void;
  onOpenCommand: () => void;
};

function formatNow(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

export function DashboardTopbar({ role, isMenuOpen, onOpenMenu, onOpenCommand }: DashboardTopbarProps) {
  const pathname = usePathname();
  const routeMeta = getDashboardRouteMeta(pathname, role);
  const [nowLabel, setNowLabel] = useState("");

  useEffect(() => {
    const update = () => setNowLabel(formatNow(new Date()));
    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <header className="ops-topbar">
      <button
        type="button"
        className="ops-menu-button"
        aria-label="Open navigation"
        aria-expanded={isMenuOpen}
        onClick={onOpenMenu}
      >
        <Menu size={19} />
      </button>
      <div className="ops-page-title">
        <span>{routeMeta.eyebrow}</span>
        <h1>{routeMeta.title}</h1>
      </div>
      <div className="ops-topbar-tools">
        <button
          type="button"
          className="ops-search"
          onClick={onOpenCommand}
          title="Search or jump to a workspace page"
        >
          <Search size={15} aria-hidden="true" />
          <span>{getDashboardSearchPrompt(role)}</span>
          <kbd>/</kbd>
        </button>
        <div className="ops-now" aria-label={nowLabel ? `Current time: ${nowLabel}` : "Current time"}>
          <i aria-hidden="true" />
          <span>{nowLabel || "Local time"}</span>
        </div>
      </div>
    </header>
  );
}
