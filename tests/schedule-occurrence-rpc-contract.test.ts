import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260718160000_harden_schedule_occurrence_crud.sql",
  ),
  "utf8",
);

describe("schedule occurrence RPC contract", () => {
  it("updates group linkage while reserving cancellation for its cascade", () => {
    expect(migration).toContain("p_group_id text");
    expect(migration).toContain('"groupId" = nullif(p_group_id, \'\')');
    expect(migration).toContain(
      "Use the cancellation operation to cancel sessions.",
    );
  });

  it("only deletes empty draft occurrences", () => {
    expect(migration).toContain(
      "create or replace function public.delete_training_session",
    );
    expect(migration).toContain("current_status <> 'DRAFT'");
    expect(migration).toContain(
      "Only empty draft sessions can be deleted.",
    );
  });

  it("keeps schedule mutation RPCs service-role only", () => {
    expect(migration).toMatch(
      /revoke all on function public\.update_training_session\([\s\S]*?\) from public, anon, authenticated;/,
    );
    expect(migration).toContain(
      "revoke all on function public.delete_training_session(text)",
    );
    expect(migration).toContain(
      "grant execute on function public.delete_training_session(text) to service_role;",
    );
  });
});
