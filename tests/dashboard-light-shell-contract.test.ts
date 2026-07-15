import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const layout = readFileSync(resolve(root, "app/(dashboard)/layout.tsx"), "utf8");
const shell = readFileSync(resolve(root, "components/dashboard/dashboard-role-shell.tsx"), "utf8");
const sidebar = readFileSync(resolve(root, "components/dashboard/dashboard-sidebar.tsx"), "utf8");
const topbar = readFileSync(resolve(root, "components/dashboard/dashboard-topbar.tsx"), "utf8");
const styles = readFileSync(resolve(root, "app/(dashboard)/dashboard-light-shell.css"), "utf8");

describe("warm light dashboard shell contract", () => {
  it("loads the light shell after legacy workspace CSS", () => {
    expect(layout.indexOf("./dashboard-shell.css")).toBeGreaterThanOrEqual(0);
    expect(layout.indexOf("./dashboard-light-shell.css")).toBeGreaterThan(
      layout.indexOf("./dashboard-shell.css"),
    );
  });

  it("uses Radix Dialog for the mobile navigation boundary", () => {
    expect(shell).toContain("<Dialog.Root");
    expect(sidebar).toContain("<Dialog.Portal>");
    expect(sidebar).toContain("<Dialog.Overlay");
    expect(sidebar).toContain("<Dialog.Content");
    expect(sidebar).toContain("<Dialog.Title");
    expect(sidebar).toContain("<Dialog.Description");
    expect(sidebar).toContain("<Dialog.Close");
    expect(shell).toContain("onOpenMenu={() => setIsSidebarOpen(true)}");
    expect(topbar).toContain("onClick={onOpenMenu}");
    expect(shell).not.toContain("addEventListener");
  });

  it("keeps navigation role-driven and route-aware", () => {
    expect(topbar).toContain("getDashboardNav(role)");
    expect(topbar).toContain("isDashboardNavItemActive");
    expect(sidebar).toContain("getDashboardNav(role)");
    expect(sidebar).toContain("aria-current");
  });

  it("implements the handoff shell without viewport scaling", () => {
    expect(styles).toContain("width: min(1400px, 100%)");
    expect(styles).toContain("border-radius: var(--mv-radius-shell)");
    expect(styles).toContain("grid-template-columns: 58px minmax(0, 1fr)");
    expect(styles).not.toContain("scale(");
    expect(styles).not.toContain("backdrop-filter");
    expect(styles).not.toContain("h-screen");
  });

  it("keeps touch targets and mobile safe areas explicit", () => {
    expect(styles).toMatch(/\.dashboard-topbar__action,[\s\S]*?width:\s*44px;/);
    expect(styles).toMatch(/\.dashboard-topbar__action,[\s\S]*?height:\s*44px;/);
    expect(styles).toContain("env(safe-area-inset-top)");
    expect(styles).toContain("env(safe-area-inset-bottom)");
  });
});
