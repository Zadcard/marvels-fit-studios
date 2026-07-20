import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const clientAction = read("app/actions/admin-clients.ts");
const coachAction = read("app/actions/admin-coaches.ts");
const promotionService = read("lib/leads/promote-leads-to-clients.ts");
const removeClientIdMigration = read(
  "supabase/migrations/20260720000000_remove_client_id_membership_code.sql",
);
const coachMigration = read(
  "supabase/migrations/20260718150000_require_new_coach_password_rotation.sql",
);
const clientWorkspace = read("components/dashboard/admin-clients-workspace.tsx");
const coachWorkspace = read(
  "components/dashboard/admin-coaches-command-center.tsx",
);

describe("admin account onboarding", () => {
  it("uses random temporary passwords for coach account creation", () => {
    expect(coachAction).toContain("generateTemporaryPassword()");
    expect(coachAction).not.toContain("MFS_${localPart");
  });

  it("creates clients without login credentials, since only staff sign in", () => {
    expect(removeClientIdMigration).toContain(
      'DROP COLUMN IF EXISTS "clientId"',
    );
    expect(clientAction).not.toContain("temporaryPassword");
    expect(clientAction).not.toContain("generateTemporaryPassword");
    expect(promotionService).not.toContain("temporaryPassword");
    expect(coachMigration).toMatch(/p_password_hash,\s+true,\s+'COACH'/);
  });

  it("returns a one-time credential DTO only for coach creation", () => {
    expect(clientAction).toContain("await requireRole(UserRole.ADMIN)");
    expect(clientAction).not.toContain("temporaryPassword");

    expect(coachAction).toContain("await requireRole(UserRole.ADMIN)");
    expect(coachAction).toContain("credentials:");
    expect(coachAction).toContain("temporaryPassword");
  });

  it("shows the one-time credential dialog only in the coach workspace", () => {
    expect(coachWorkspace).toContain("<TemporaryCredentialsDialog");
    expect(clientWorkspace).not.toContain("<TemporaryCredentialsDialog");
  });
});
