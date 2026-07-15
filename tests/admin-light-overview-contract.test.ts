import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

async function read(relativePath: string) {
  return readFile(path.join(root, relativePath), "utf8");
}

describe("warm-light admin overview", () => {
  it("keeps the existing server repository as the page data source", async () => {
    const page = await read("app/(dashboard)/admin/page.tsx");

    expect(page).toContain("adminOverviewRepository.getOverview()");
    expect(page).toContain("upcomingSessions");
    expect(page).toContain("recentActivity");
    expect(page).toContain("quickActions");
    expect(page).toContain("studioSnapshot");
  });

  it("preserves the real admin destinations without placeholder controls", async () => {
    const page = await read("app/(dashboard)/admin/page.tsx");

    expect(page).toContain('href="/admin/notifications"');
    expect(page).toContain('href="/admin/clients"');
    expect(page).toContain('href="/admin/sessions"');
    expect(page).not.toContain('href="#"');
    expect(page).not.toContain("DashboardSurfaceNote");
    expect(page).not.toContain("DashboardStatCard");
  });

  it("uses the light design tokens and responsive native layout", async () => {
    const css = await read("app/(dashboard)/admin/page.module.css");

    expect(css).toContain("var(--mv-card)");
    expect(css).toContain("var(--mv-app-bg)");
    expect(css).toContain("@media (max-width: 760px)");
    expect(css).not.toMatch(/#[0-9a-f]{3,8}/i);
    expect(css).not.toContain("scale(");
    expect(css).not.toContain("backdrop-filter");
  });

  it("provides a route-safe browser preview inside the production shell", async () => {
    const preview = await read(
      "app/(dashboard)/design-system/screens/admin-overview/page.tsx",
    );

    expect(preview).toContain("DashboardRoleShell");
    expect(preview).toContain("<AdminOverviewPage />");
    expect(preview).toContain('role="admin"');
  });
});
