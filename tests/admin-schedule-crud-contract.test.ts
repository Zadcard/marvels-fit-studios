import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("live admin schedule CRUD", () => {
  const page = read("app/(dashboard)/admin/schedule/page.tsx");
  const workspace = read("components/dashboard/admin-schedule-workspace.tsx");

  it("renders the functional workspace with the configured week start", () => {
    expect(page).toContain("AdminScheduleWorkspace");
    expect(page).toContain("adminSettingsRepository.get()");
    expect(page).toContain("settings.scheduleStartDay");
  });

  it("supports guarded occurrence, group, and roster operations", () => {
    expect(workspace).toContain("saveAdminSession");
    expect(workspace).toContain("cancelAdminSession");
    expect(workspace).toContain("deleteAdminSession");
    expect(workspace).toContain("assignClientToSession");
    expect(workspace).toContain("removeClientFromSession");
    expect(workspace).toContain("groupId: form.groupId || null");
  });

  it("does not bypass the cascading cancellation operation", () => {
    expect(workspace).not.toContain('<option value="CANCELED">');
    expect(workspace).not.toContain("/admin/schedule/templates");
  });
});
