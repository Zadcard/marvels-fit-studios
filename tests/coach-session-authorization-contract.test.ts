import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const actions = readFileSync(
  resolve(process.cwd(), "app/actions/coach-session-bookings.ts"),
  "utf8",
);

describe("coach session write authorization", () => {
  it("guards every write and scopes session and client access", () => {
    expect(actions.match(/requireRole\(UserRole\.COACH\)/g)).toHaveLength(3);
    expect(actions).toContain("requireOwnedSessionForCoach");
    expect(actions).toContain("requireCoachClientAccess(user.id, parsed.data.clientId)");
    expect(actions).toContain("markCoachSessionAttendance");
    expect(actions).toContain("updateSessionAttendance(parsed.data)");
  });
});
