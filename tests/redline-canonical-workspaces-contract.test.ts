import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("REDLINE canonical admin workspaces", () => {
  it("owns the member directory without legacy dashboard primitives", () => {
    const workspace = read("components/dashboard/admin-clients-workspace.tsx");
    const styles = read("components/dashboard/admin-clients-workspace.module.css");

    expect(workspace).toContain("Know every member");
    expect(workspace).toContain("saveAdminClient");
    expect(workspace).toContain("deleteAdminClient");
    expect(workspace).toContain("<Dialog.Portal>");
    expect(workspace).toContain("useSearchParams");
    expect(workspace).not.toContain("DashboardMiniStat");
    expect(workspace).not.toContain("DashboardSurfaceNote");
    expect(styles).toContain("var(--rl-red)");
    expect(styles).toContain("@media (max-width: 700px)");
  });

  it("owns a functional weekly schedule connected to existing actions", () => {
    const workspace = read("components/dashboard/admin-schedule-workspace.tsx");
    const page = read("app/(dashboard)/admin/schedule/page.tsx");
    const repository = read("lib/repositories/admin-schedule-repository.ts");
    const styles = read("components/dashboard/admin-schedule-workspace.module.css");

    expect(workspace).toContain("Program the week");
    expect(workspace).toContain("saveAdminSession");
    expect(workspace).toContain("cancelAdminSession");
    expect(workspace).toContain("bulkUpdateAdminSessions");
    expect(workspace).toContain("navigateWeek");
    expect(workspace).toContain("navigateToday");
    expect(workspace).toContain("<Dialog.Portal>");
    expect(page).toContain("searchParams.week");
    expect(repository).toContain("input?.weekStart");
    expect(styles).toContain("var(--session-top)");
    expect(styles).toContain("@media (max-width: 700px)");
  });

  it("owns the session ledger and every existing session mutation", () => {
    const workspace = read("components/dashboard/admin-sessions-workspace.tsx");
    const styles = read("components/dashboard/admin-sessions-workspace.module.css");

    expect(workspace).toContain("Run every block");
    expect(workspace).toContain("saveAdminSession");
    expect(workspace).toContain("cancelAdminSession");
    expect(workspace).toContain("deleteAdminSession");
    expect(workspace).toContain("assignClientToSession");
    expect(workspace).toContain("removeClientFromSession");
    expect(workspace).toContain("markAttendance");
    expect(workspace).toContain("<Dialog.Portal>");
    expect(workspace).not.toContain("DashboardManagementToolbar");
    expect(styles).toContain("var(--rl-red)");
    expect(styles).not.toContain("var(--mv-");
    expect(styles).toContain("@media(max-width:700px)");
  });

  it("owns the intake decision queue and secure approval handoff", () => {
    const workspace = read("components/dashboard/admin-leads-workspace.tsx");
    const styles = read("components/dashboard/admin-leads-workspace.module.css");
    expect(workspace).toContain("Choose who joins");
    expect(workspace).toContain("approveLeadAsClient");
    expect(workspace).toContain("deleteLead");
    expect(workspace).toContain("temporaryPassword");
    expect(workspace).toContain("useSearchParams");
    expect(workspace).toContain("<Dialog.Portal>");
    expect(workspace).not.toContain("DashboardModal");
    expect(styles).toContain("var(--rl-red)");
    expect(styles).not.toContain("var(--mv-");
  });

  it("owns the admin identity surface and removes the redirected billing relic", () => {
    const workspace = read("components/dashboard/admin-profile-workspace.tsx");
    const styles = read("components/dashboard/admin-profile-workspace.module.css");
    expect(workspace).toContain("Own the controls");
    expect(workspace).toContain("saveAdminProfile");
    expect(workspace).toContain('href="/change-password"');
    expect(workspace).not.toContain("DashboardPageHeader");
    expect(workspace).not.toContain("AccountSecurityPanel");
    expect(styles).toContain("var(--rl-red)");
    expect(() => read("components/dashboard/admin-subscriptions-workspace.tsx")).toThrow();
  });

  it("owns the persisted studio rules console", () => {
    const workspace = read("components/dashboard/admin-settings-workspace.tsx");
    const styles = read("components/dashboard/admin-settings-workspace.module.css");
    expect(workspace).toContain("Set the operating code");
    expect(workspace).toContain("saveSettingsAction");
    expect(workspace).toContain("overbookWaitlist");
    expect(workspace).not.toContain("DashboardFormSection");
    expect(workspace).not.toContain("DashboardSwitch");
    expect(styles).toContain("var(--rl-red)");
    expect(styles).not.toContain("var(--mv-");
  });

  it("keeps temporary visual QA routes out of the product tree", () => {
    expect(() => read("app/redline-qa/clients/page.tsx")).toThrow();
    expect(() => read("app/redline-qa/schedule/page.tsx")).toThrow();
  });
});
