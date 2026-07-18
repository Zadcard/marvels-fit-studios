import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const action = readFileSync(resolve(process.cwd(), "app/actions/coach-settings.ts"), "utf8");

describe("coach settings authorization and mapping", () => {
  it("keeps the write coach-guarded and maps every supported specialty", () => {
    expect(action).toContain("requireRole(UserRole.COACH)");
    for (const value of [
      "STRENGTH", "CONDITIONING", "MOBILITY", "PRIVATE_COACHING", "FOOTBALL",
      "TENNIS", "CALISTHENICS", "REHAB", "ATHLETIC_PERFORMANCE", "GENERAL_FITNESS",
    ]) {
      expect(action).toContain(`CoachSpecialization.${value}`);
    }
    expect(action).toContain('revalidatePath("/coach/settings")');
  });
});
