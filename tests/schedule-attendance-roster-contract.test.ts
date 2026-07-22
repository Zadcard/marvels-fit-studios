import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("schedule attendance roster contract", () => {
  it("keeps every attendance outcome in the schedule roster", () => {
    const repository = read("lib/repositories/admin-schedule-repository.ts");

    expect(repository).toContain('clients:Client(id, fullName, phone, status, injuryStatus)');
    expect(repository).toContain('"LATE", "MISSED", "EXCUSED", "NO_SHOW"');
    expect(repository).toContain('status: "BOOKED" as const');
  });

  it("uses only time-based session labels", () => {
    const repository = read("lib/repositories/admin-schedule-repository.ts");
    const scheduleData = read("lib/dashboard/admin-schedule-data.ts");

    expect(repository).toContain('now >= input.endsAt.getTime()');
    expect(repository).toContain('return "Live" as const');
    expect(repository.toLowerCase()).not.toContain("confirmed");
    expect(scheduleData).toContain('["All statuses", "Upcoming", "Live", "Completed"]');
  });

  it("persists late and excused and can create a missing roster booking", () => {
    const enumMigration = read(
      "supabase/migrations/20260726160000_add_late_and_excused_attendance.sql",
    );
    const rosterMigration = read(
      "supabase/migrations/20260726161000_upsert_full_session_attendance_roster.sql",
    );

    expect(enumMigration).toContain("'LATE'");
    expect(enumMigration).toContain("'EXCUSED'");
    expect(rosterMigration).toContain('insert into public."SessionBooking"');
    expect(rosterMigration).toContain("p_status in ('ATTENDED', 'LATE')");
    expect(rosterMigration).toContain("booking.\"status\" in ('ATTENDED', 'LATE')");
  });
});
