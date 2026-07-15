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

  it("keeps temporary visual QA routes out of the product tree", () => {
    expect(() => read("app/redline-qa/clients/page.tsx")).toThrow();
    expect(() => read("app/redline-qa/schedule/page.tsx")).toThrow();
  });
});
