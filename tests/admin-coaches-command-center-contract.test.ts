import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const page = readFileSync(resolve(root, "app/(dashboard)/admin/coaches/page.tsx"), "utf8");
const screen = readFileSync(resolve(root, "components/dashboard/admin-coaches-command-center.tsx"), "utf8");
const styles = readFileSync(resolve(root, "components/dashboard/admin-coaches-command-center.module.css"), "utf8");
const repository = readFileSync(resolve(root, "lib/repositories/admin-coach-repository.ts"), "utf8");
const entityForm = readFileSync(resolve(root, "components/ui/entity-form.tsx"), "utf8");

describe("admin coach management contract", () => {
  it("renders the command center from repository records", () => {
    expect(page).toContain("adminCoachRepository.list()");
    expect(page).toContain("AdminCoachesCommandCenter");
    expect(page).not.toContain("AdminCoachesWorkspace");
  });

  it("keeps the reusable management surface wired to real mutations", () => {
    expect(screen).toContain("saveCoach");
    expect(screen).toContain("deleteCoach");
    expect(screen).toContain("New coach");
    expect(screen).toContain("Save coach");
    expect(screen).toContain("ConfirmDeleteDialog");
    expect(entityForm).toContain("Delete permanently");
    expect(screen).toContain("EntityDialog");
    expect(screen).toContain("Close coach editor");
  });

  it("hides the placeholder coach and formats singular workloads", () => {
    expect(repository).toContain('!== "coach@test.com"');
    expect(screen).toContain('coach.sessionsThisWeek === 1 ? "Session/wk"');
    expect(screen).toContain('coach.activeClients === 1 ? "Client"');
  });

  it("uses the current responsive REDLINE styling", () => {
    expect(styles).toContain(".coachGrid");
    expect(styles).toContain(".timeline");
    expect(styles).toContain("@media(max-width:960px)");
    expect(styles).toContain("@media(max-width:620px)");
    expect(styles).toContain("var(--rl-red)");
    expect(styles).not.toContain("var(--mv-");
    expect(styles).not.toContain("scale(");
  });

  it("shares the REDLINE entity-editor dialog styling instead of a page-local copy", () => {
    const sharedStyles = readFileSync(
      resolve(root, "components/ui/entity-form.module.css"),
      "utf8",
    );
    expect(sharedStyles).toContain(".dialog");
    expect(sharedStyles).toContain("var(--rl-red)");
  });
});
