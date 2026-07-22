import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const action = readFileSync("app/actions/admin-schedule-change-requests.ts", "utf8");
const originalMigration = readFileSync(
  "supabase/migrations/20260718150104_add_schedule_change_requests.sql",
  "utf8",
);
const permanentGroupChangeMigration = readFileSync(
  "supabase/migrations/20260721120000_permanent_group_change_requests.sql",
  "utf8",
);
describe("schedule change request action wiring", () => {
  it("routes both mutations through the admin-only RPCs", () => {
    expect(action).toContain('rpc("log_schedule_change_request"');
    expect(action).toContain('rpc("decide_schedule_change_request"');
    expect(action.match(/requireRole\(UserRole\.ADMIN\)/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it("passes the destination group to the log RPC", () => {
    expect(action).toContain("p_to_group_id: value.toGroupId");
  });

  it("knows about the PERMANENT_GROUP_CHANGE validation errors", () => {
    expect(action).toContain("A current group, a new group, and an effective date are required.");
    expect(action).toContain("The new group must be different from the current group.");
    expect(action).toContain("The target session has already happened or is no longer active.");
  });
});

describe("original schedule change request migration", () => {
  it("keeps both RPCs service-role only", () => {
    expect(originalMigration).toContain("security definer");
    expect(originalMigration).toMatch(/grant execute on function public\.log_schedule_change_request[\s\S]*?to service_role/);
    expect(originalMigration).toMatch(/grant execute on function public\.decide_schedule_change_request[\s\S]*?to service_role/);
  });
});

describe("permanent group change migration", () => {
  it("adds toGroupId and extends the kind check constraint", () => {
    expect(permanentGroupChangeMigration).toContain('add column "toGroupId" text references public."Group"("id")');
    expect(permanentGroupChangeMigration).toContain("'PERMANENT_GROUP_CHANGE'");
  });

  it("requires groupId, toGroupId, and effectiveFrom for PERMANENT_GROUP_CHANGE and forbids a no-op move", () => {
    expect(permanentGroupChangeMigration).toMatch(
      /"kind" = 'PERMANENT_GROUP_CHANGE'[\s\S]*?"groupId" is not null and "toGroupId" is not null and "groupId" <> "toGroupId"/,
    );
  });

  it("hardens MOVE_OCCURRENCE against completed/past/category-mismatched targets", () => {
    expect(permanentGroupChangeMigration).toContain(
      "target_session.\"status\" in ('CANCELED', 'COMPLETED') or target_session.\"startsAt\" <= now()",
    );
    expect(permanentGroupChangeMigration).toContain("does not match the source session''s training category");
  });

  it("checks destination group capacity before flipping membership on approval", () => {
    expect(permanentGroupChangeMigration).toMatch(
      /select "capacity" into to_group_capacity[\s\S]*?The new group is already at capacity/,
    );
  });

  it("only cancels and rebooks sessions on/after the effective date, preserving history", () => {
    expect(permanentGroupChangeMigration).toMatch(
      /training_session\."startsAt" > now\(\)[\s\S]*?>= request_record\."effectiveFrom"/,
    );
  });

  it("flips Client.groupId immediately on approval rather than deferring to a scheduled job", () => {
    expect(permanentGroupChangeMigration).toContain('update public."Client"\n      set "groupId" = request_record."toGroupId"');
  });

  it("reuses book_client_into_session for the best-effort rebooking loop, not duplicated capacity logic", () => {
    expect(permanentGroupChangeMigration).toContain('perform public.book_client_into_session(occurrence."id", request_record."clientId")');
  });

  it("drops the stale 10-arg log_schedule_change_request overload before recreating it with 11 args", () => {
    expect(permanentGroupChangeMigration).toMatch(
      /drop function if exists public\.log_schedule_change_request\(\s*text, text, text, text, text, text, text, integer\[\], integer\[\], date\s*\);/,
    );
  });

  it("re-grants both RPCs to service_role with the new 11-arg signature", () => {
    expect(permanentGroupChangeMigration).toMatch(
      /grant execute on function public\.log_schedule_change_request\(\s*text, text, text, text, text, text, text, integer\[\], integer\[\], date, text\s*\)\s*to service_role/,
    );
  });
});
