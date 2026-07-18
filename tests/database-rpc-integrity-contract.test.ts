import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const migration = readFileSync(
  resolve(
    root,
    "supabase/migrations/20260718140000_fix_client_and_lead_rpc_integrity.sql",
  ),
  "utf8",
);
const promotionService = readFileSync(
  resolve(root, "lib/leads/promote-leads-to-clients.ts"),
  "utf8",
);

describe("client and lead RPC integrity migration", () => {
  it("replaces UUID assumptions with the schema's text identifiers", () => {
    expect(migration).toContain("create function public.admin_save_client(payload jsonb)");
    expect(migration).toContain("returns text");
    expect(migration).toContain("target_lead_id text");
    expect(migration).not.toContain("::uuid");
  });

  it("records a payment only for creation or a real transition to paid", () => {
    expect(migration).toContain("previous_payment_status is distinct from 'PAID'");
    expect(migration).toContain("should_record_payment := (payload->>'paymentStatus') = 'PAID'");
    expect(migration).toContain("if should_record_payment then");
  });

  it("requires password rotation and preserves existing client credentials", () => {
    expect(migration).toMatch(/payload->>'password',\s+true,\s+'CLIENT'/);
    expect(migration).toContain("'credentialsIssued', false");
    expect(promotionService).toContain("promotionResult?.credentialsIssued !== false");
    expect(promotionService).toContain(
      "Linked the lead to the existing client account without changing its credentials.",
    );
  });

  it("keeps both definer functions service-role only", () => {
    expect(migration).toContain(
      "revoke all on function public.admin_save_client(jsonb) from public, anon, authenticated",
    );
    expect(migration).toContain(
      "revoke all on function public.promote_lead_to_client(text, text, text) from public, anon, authenticated",
    );
    expect(migration).toContain(
      "grant execute on function public.promote_lead_to_client(text, text, text) to service_role",
    );
  });
});
