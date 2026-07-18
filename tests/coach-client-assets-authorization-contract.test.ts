import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const actions = readFileSync(
  resolve(process.cwd(), "app/actions/coach-client-assets.ts"),
  "utf8",
);
const repository = readFileSync(
  resolve(process.cwd(), "lib/repositories/coach-client-repository.ts"),
  "utf8",
);

describe("coach client asset authorization", () => {
  it("guards writes and checks coach ownership before notes or uploads", () => {
    expect(actions.match(/requireRole\(UserRole\.COACH\)/g)).toHaveLength(2);
    expect(actions).toContain("requireCoachClientAccess(coach.id, clientId)");
    expect(actions).toContain("requireCoachClientAccess(coach.id, targetId)");
    expect(actions).toContain("assertCoachCanAccessGroup(coach.id, targetId)");
  });

  it("only renders active files uploaded by the current coach", () => {
    expect(repository).toContain("file.uploadedById === userId");
    expect(repository).toContain("canEdit: note.author?.id === userId");
  });
});
