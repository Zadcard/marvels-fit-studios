import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const page = readFileSync(resolve(root, "app/(dashboard)/admin/coaches/page.tsx"), "utf8");
const screen = readFileSync(resolve(root, "components/dashboard/admin-coaches-command-center.tsx"), "utf8");
const styles = readFileSync(resolve(root, "components/dashboard/admin-coaches-command-center.module.css"), "utf8");

describe("admin coach command center redesign", () => {
  it("replaces the old management workspace at the route boundary", () => {
    expect(page).toContain("AdminCoachesCommandCenter");
    expect(page).not.toContain("AdminCoachesWorkspace");
  });

  it("keeps real mutations while introducing new screen composition", () => {
    expect(screen).toContain("saveCoach");
    expect(screen).toContain("deleteCoach");
    expect(screen).toContain("Deploy the team");
    expect(screen).toContain("7-day deployment");
    expect(screen).toContain("focusNumbers");
    expect(screen).toContain("<Dialog.Content");
    expect(screen).not.toContain("DashboardManagementToolbar");
    expect(screen).not.toContain("dashboard-table");
    expect(screen).not.toContain("DashboardModal");
  });

  it("uses a dedicated responsive screen design without viewport scaling", () => {
    expect(styles).toContain(".rosterList");
    expect(styles).toContain(".loadBars");
    expect(styles).toContain("@media(max-width:700px)");
    expect(styles).toContain("@media(prefers-reduced-motion:reduce)");
    expect(styles).toContain("var(--rl-red)");
    expect(styles).not.toContain("var(--mv-");
    expect(styles).not.toContain("scale(");
  });
});
