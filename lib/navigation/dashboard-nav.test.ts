import { describe, expect, it } from "vitest";

import {
  getDashboardProfileMeta,
  getDashboardRoleLabel,
  getDashboardRouteMeta,
  getDashboardSidebarNav,
} from "@/lib/navigation/dashboard-nav";

describe("dashboard navigation", () => {
  it("keeps the admin sidebar focused on primary studio workflows", () => {
    expect(getDashboardSidebarNav("admin").map((item) => item.label)).toEqual([
      "Today",
      "Attendance",
      "Schedule",
      "Leads & Trials",
      "Clients",
      "Groups",
      "Categories",
      "Coaches",
      "Subscriptions",
      "Reports",
      "Notifications",
      "Settings",
    ]);
  });

  it("exposes the new admin insights and coach workspace routes", () => {
    expect(getDashboardRouteMeta("/admin/reports", "admin").title).toBe("Reports");
    expect(getDashboardRouteMeta("/admin/notifications", "admin").title).toBe("Notifications");
    expect(getDashboardRouteMeta("/admin/settings", "admin").title).toBe("Settings");
    expect(getDashboardRouteMeta("/coach/schedule", "coach").title).toBe("Schedule");
    expect(getDashboardRouteMeta("/coach/clients", "coach").title).toBe("Clients");
    expect(getDashboardRouteMeta("/coach/alerts", "coach").title).toBe("Alerts");
  });

  it("does not retain route metadata for removed admin tools", () => {
    expect(getDashboardRouteMeta("/admin/sessions", "admin").title).toBe(
      "Today"
    );
    expect(getDashboardRouteMeta("/admin/bulk-import", "admin").title).toBe(
      "Today"
    );
    expect(getDashboardRouteMeta("/admin/profile", "admin").title).toBe(
      "Today"
    );
  });

  it("uses generic fallbacks rather than demo people", () => {
    expect(getDashboardProfileMeta("admin").name).toBe("Admin account");
    expect(getDashboardProfileMeta("coach").name).toBe("Coach account");
    expect(getDashboardProfileMeta("client").name).toBe("Coach account");
  });

  it("keeps the parked client portal out of operations navigation", () => {
    expect(getDashboardRoleLabel("client")).toBe("Unavailable");
    expect(getDashboardSidebarNav("client")).toEqual([]);
  });
});
