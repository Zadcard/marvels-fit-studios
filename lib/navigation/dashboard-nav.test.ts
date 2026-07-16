import { describe, expect, it } from "vitest";

import {
  getDashboardProfileMeta,
  getDashboardRouteMeta,
  getDashboardSidebarNav,
} from "@/lib/navigation/dashboard-nav";

describe("dashboard navigation", () => {
  it("keeps the admin sidebar focused on primary studio workflows", () => {
    expect(getDashboardSidebarNav("admin").map((item) => item.label)).toEqual([
      "Dashboard",
      "Clients",
      "Attendance",
      "Groups",
      "Coaches",
      "Calendar",
      "Leads",
      "Settings",
    ]);
  });

  it("retains route metadata for contextual tools hidden from the sidebar", () => {
    expect(getDashboardRouteMeta("/admin/sessions", "admin").title).toBe(
      "Sessions"
    );
    expect(getDashboardRouteMeta("/admin/bulk-import", "admin").title).toBe(
      "Bulk Import"
    );
    expect(getDashboardRouteMeta("/admin/profile", "admin").title).toBe(
      "Profile"
    );
  });

  it("uses generic fallbacks rather than demo people", () => {
    expect(getDashboardProfileMeta("admin").name).toBe("Admin account");
    expect(getDashboardProfileMeta("coach").name).toBe("Coach account");
    expect(getDashboardProfileMeta("client").name).toBe("Client account");
  });

  it("exposes the client transformation progress workspace", () => {
    expect(getDashboardSidebarNav("client").map((item) => item.label)).toContain(
      "Progress",
    );
  });

  it("retains contextual metadata for automation routes", () => {
    expect(getDashboardRouteMeta("/admin/schedule/templates", "admin").title).toBeTruthy();
    expect(getDashboardRouteMeta("/client/notifications", "client").title).toBeTruthy();
  });
});
