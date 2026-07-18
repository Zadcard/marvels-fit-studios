import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260718170000_add_auditable_studio_expense_ledger.sql"),
  "utf8",
);
const actions = readFileSync(resolve(process.cwd(), "app/actions/admin-expenses.ts"), "utf8");

describe("studio expense ledger", () => {
  it("keeps posted and voided expenses auditable", () => {
    expect(migration).toContain('create table public."StudioExpense"');
    expect(migration).toContain('"expenseNumber" text not null unique');
    expect(migration).toContain('"createdById" text not null');
    expect(migration).toContain('constraint "StudioExpense_void_audit_check"');
    expect(migration).toContain("create or replace function public.void_studio_expense");
    expect(migration).not.toContain('delete from public."StudioExpense"');
  });

  it("limits RPC execution to the service role and guards both actions", () => {
    expect(migration.match(/from public, anon, authenticated;/g)).toHaveLength(2);
    expect(migration.match(/grant execute on function/g)).toHaveLength(2);
    expect(migration.match(/to service_role;/g)).toHaveLength(3);
    expect(actions.match(/requireRole\(UserRole\.ADMIN\)/g)).toHaveLength(2);
    expect(actions).toContain('revalidatePath("/admin/reports")');
  });
});
