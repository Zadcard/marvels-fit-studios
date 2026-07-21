import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("Marvel Ops canonical workspaces", () => {
  it("keeps only the designed admin routes in the active navigation", () => {
    const navigation = read("lib/navigation/dashboard-nav.ts");
    for (const label of ["Today", "Attendance", "Schedule", "Leads & Trials", "Clients", "Categories & Groups", "Coaches", "Subscriptions"]) {
      expect(navigation).toContain(`label: "${label}"`);
    }
  });

  it("keeps attendance interactions aligned with persisted booking states", () => {
    const workspace = read("components/dashboard/admin-attendance-workspace.tsx");
    expect(workspace).toContain("Mark all in");
    expect(workspace).toContain("markAttendance");
    expect(workspace).toContain('nextStatus === "Booked"');
    expect(workspace).toContain("stopPropagation");
    expect(workspace).not.toContain('status: "Late"');
    expect(workspace).not.toContain("Send summary to coach");
  });

  it("keeps full client management and cash-out in the operations design", () => {
    const clientPage = read("app/(dashboard)/admin/clients/page.tsx");
    const clientWorkspace = read("components/dashboard/admin-clients-workspace.tsx");
    expect(clientPage).toContain("AdminClientsWorkspace");
    expect(clientWorkspace).toContain("saveAdminClient");
    expect(clientWorkspace).toContain("deleteAdminClient");
    expect(clientWorkspace).toContain("<Dialog.Portal>");
    expect(read("components/dashboard/marvel-ops-admin-view.tsx")).not.toContain(
      "Client creation will be connected",
    );
    expect(read("components/dashboard/admin-cash-out-dialog.tsx")).toContain("Record cash out");
  });

  it("keeps full group management inside the category route", () => {
    const groupPage = read("app/(dashboard)/admin/groups/page.tsx");
    const categoryPage = read("app/(dashboard)/admin/categories/page.tsx");
    const groupWorkspace = read("components/dashboard/admin-groups-workspace.tsx");
    expect(groupPage).toContain('redirect("/admin/categories")');
    expect(categoryPage).toContain("AdminTrainingCategoriesWorkspace");
    expect(categoryPage).toContain("adminGroupRepository.list()");
    expect(groupWorkspace).toContain("saveAdminGroup");
    expect(groupWorkspace).toContain("deleteAdminGroup");
    expect(groupWorkspace).toContain("setAdminGroupMembership");
  });

  it("keeps schedule navigation server-backed and removes fake requests", () => {
    const schedulePage = read("app/(dashboard)/admin/schedule/page.tsx");
    const scheduleWorkspace = read("components/dashboard/admin-schedule-workspace.tsx");
    expect(schedulePage).toContain("getSchedule({ weekStart })");
    expect(scheduleWorkspace).toContain('params.set("week"');
    expect(scheduleWorkspace).not.toContain("setResolved");
    expect(scheduleWorkspace).not.toContain("Approve request");
  });

  it("renders one canonical settings form", () => {
    const settingsPage = read("app/(dashboard)/admin/settings/page.tsx");
    const settingsWorkspace = read("components/dashboard/admin-settings-workspace.tsx");
    expect(settingsPage).toContain("AdminSettingsWorkspace");
    expect(settingsPage).not.toContain("MarvelOpsSettings");
    expect(settingsWorkspace.match(/<form\b/g)).toHaveLength(1);
  });

  it("uses singular renewal copy for a one-day interval", () => {
    const subscriptions = read(
      "components/dashboard/marvel-ops-groups-subscriptions.tsx",
    );
    expect(subscriptions).toContain(
      'difference === 1 ? "day" : "days"',
    );
    expect(subscriptions).not.toContain('`in ${difference} days`');
  });

  it("removes public landing and client portal rendering files", () => {
    expect(existsSync(resolve(root, "app/landing.css"))).toBe(false);
    expect(existsSync(resolve(root, "components/landing/landing-sections.tsx"))).toBe(false);
    expect(existsSync(resolve(root, "components/dashboard/client-overview-workspace.tsx"))).toBe(false);
  });
});
