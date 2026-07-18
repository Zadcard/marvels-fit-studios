import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const issueMigration = readFileSync(
  resolve("supabase/migrations/20260718171000_add_one_time_password_reset_grants.sql"),
  "utf8",
);
const serializationMigration = readFileSync(
  resolve("supabase/migrations/20260718171100_serialize_password_reset_grant_issuance.sql"),
  "utf8",
);
const accountAction = readFileSync(resolve("app/actions/account-security.ts"), "utf8");

describe("password reset security contract", () => {
  it("keeps grants and RPCs inaccessible to browser database roles", () => {
    expect(issueMigration).toMatch(
      /revoke all on table public\."PasswordResetGrant" from anon, authenticated/i,
    );
    expect(issueMigration).toMatch(
      /revoke all on function public\.issue_password_reset_grant[\s\S]*from public, anon, authenticated/i,
    );
    expect(issueMigration).toMatch(
      /revoke all on function public\.consume_password_reset_grant[\s\S]*from public, anon, authenticated/i,
    );
  });

  it("serializes issuance and atomically locks consumption", () => {
    expect(serializationMigration).toContain(
      'create unique index "PasswordResetGrant_one_active_per_user_key"',
    );
    expect(serializationMigration).toMatch(/from public\."User" target[\s\S]*for update/i);
    expect(issueMigration).toMatch(
      /from public\."PasswordResetGrant" reset_grant[\s\S]*for update/i,
    );
  });

  it("keeps the link-issuing server action admin guarded", () => {
    expect(accountAction).toMatch(
      /issueAccountPasswordResetLink[\s\S]*requireRole\(UserRole\.ADMIN\)/,
    );
  });
});
