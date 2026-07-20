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
const removeClientIdMigration = readFileSync(
  resolve(
    root,
    "supabase/migrations/20260720000000_remove_client_id_membership_code.sql",
  ),
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

  it("drops the membership Client ID and creates clients without credentials", () => {
    expect(removeClientIdMigration).toContain(
      'ALTER TABLE public."User" DROP COLUMN IF EXISTS "clientId"',
    );
    expect(removeClientIdMigration).not.toContain("payload->>'password'");
    expect(promotionService).not.toContain("clientId");
    expect(promotionService).not.toContain("credentialsIssued");
  });

  it("keeps the recreated definer functions service-role only", () => {
    expect(removeClientIdMigration).toContain(
      "revoke all on function public.register_client(text, text, text, text) from public, anon, authenticated",
    );
    expect(removeClientIdMigration).toContain(
      "grant execute on function public.register_client(text, text, text, text) to service_role",
    );
    expect(removeClientIdMigration).toContain(
      "revoke all on function public.promote_lead_to_client(text) from public, anon, authenticated",
    );
    expect(removeClientIdMigration).toContain(
      "grant execute on function public.promote_lead_to_client(text) to service_role",
    );
  });
});
