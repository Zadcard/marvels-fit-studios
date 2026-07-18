import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const clientAction = read("app/actions/admin-clients.ts");
const coachAction = read("app/actions/admin-coaches.ts");
const promotionService = read("lib/leads/promote-leads-to-clients.ts");
const clientMigration = read(
  "supabase/migrations/20260718140000_fix_client_and_lead_rpc_integrity.sql",
);
const coachMigration = read(
  "supabase/migrations/20260718150000_require_new_coach_password_rotation.sql",
);
const clientWorkspace = read("components/dashboard/admin-clients-workspace.tsx");
const coachWorkspace = read(
  "components/dashboard/admin-coaches-command-center.tsx",
);

describe("admin account onboarding", () => {
  it("uses random temporary passwords in every live account creation path", () => {
    expect(clientAction).toContain("generateTemporaryPassword()");
    expect(coachAction).toContain("generateTemporaryPassword()");
    expect(promotionService).toContain("generateTemporaryPassword()");
    expect(coachAction).not.toContain("MFS_${localPart");
  });

  it("forces newly created client and coach accounts to rotate credentials", () => {
    expect(clientMigration).toMatch(/payload->>'password',\s+true,\s+'CLIENT'/);
    expect(coachMigration).toMatch(/p_password_hash,\s+true,\s+'COACH'/);
  });

  it("returns only a one-time credential DTO to the guarded admin caller", () => {
    for (const action of [clientAction, coachAction]) {
      expect(action).toContain("await requireRole(UserRole.ADMIN)");
      expect(action).toContain("credentials:");
      expect(action).toContain("temporaryPassword");
    }
  });

  it("shows the one-time credential dialog in both live admin workspaces", () => {
    expect(clientWorkspace).toContain("<TemporaryCredentialsDialog");
    expect(coachWorkspace).toContain("<TemporaryCredentialsDialog");
  });
});
