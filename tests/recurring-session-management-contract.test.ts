import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
const actions = read("app/actions/admin-recurring-sessions.ts");
const manager = read("components/dashboard/admin-recurring-session-manager.tsx");
const migration = read(
  "supabase/migrations/20260718162000_guard_recurring_template_deletion.sql",
);

describe("recurring session management", () => {
  it("keeps every series mutation behind the admin role guard", () => {
    expect(actions.match(/requireRole\(UserRole\.ADMIN\)/g)).toHaveLength(4);
    expect(actions).toContain("saveRecurringSessionTemplate");
    expect(actions).toContain("deleteRecurringSessionTemplate");
  });

  it("saves through the multi-slot sync RPC", () => {
    expect(actions).toContain('rpc("sync_recurring_session_template"');
    expect(actions).toContain("p_slots:");
  });

  it("exposes edit, generation, activation, and deletion in the live manager", () => {
    expect(manager).toContain("saveRecurringSessionTemplate");
    expect(manager).toContain("generateRecurringSessions");
    expect(manager).toContain("setRecurringTemplateActive");
    expect(manager).toContain("deleteRecurringSessionTemplate");
  });

  it("blocks deletion after occurrences have been generated", () => {
    expect(migration).toContain('session_record."sourceTemplateId" = p_template_id');
    expect(migration).toContain("Recurring template has generated occurrences.");
    expect(migration).toContain(
      "revoke all on function public.delete_recurring_session_template(uuid)",
    );
    expect(migration).toContain("to service_role;");
  });
});
