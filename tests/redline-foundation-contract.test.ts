import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("Marvel Fit REDLINE foundation", () => {
  it("loads one new dashboard shell without legacy style layers", () => {
    const layout = read("app/(dashboard)/layout.tsx");
    const shell = read("components/dashboard/dashboard-role-shell.tsx");
    expect(shell).toContain('redline-shell.css');
    expect(layout).not.toContain("dashboard-shell.css");
    expect(layout).not.toContain("dashboard-light-shell.css");
  });

  it("uses the approved red, black, and white foundation", () => {
    const globals = read("app/globals.css");
    expect(globals).toContain("--rl-ink: #0b0b0d");
    expect(globals).toContain("--rl-red: #e21d2e");
    expect(globals).toContain("--rl-white: #ffffff");
    expect(globals).toContain("--rl-canvas: #f4f3ef");
    expect(globals).not.toContain("#3B82F6");
    expect(globals).not.toContain("#8B5CF6");
  });

  it("uses the new athletic typography and accessible interaction foundation", () => {
    const fonts = read("app/fonts.ts");
    const globals = read("app/globals.css");
    expect(fonts).toContain("Plus_Jakarta_Sans");
    expect(fonts).toContain("Sora");
    expect(fonts).not.toContain("Manrope");
    expect(fonts).not.toContain("Space_Grotesk");
    expect(globals).toMatch(/\.mv-btn\s*\{[\s\S]*?min-height:\s*44px/);
    expect(globals).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("keeps the shell role-driven and the overview connected to real data", () => {
    const topbar = read("components/dashboard/dashboard-topbar.tsx");
    const sidebar = read("components/dashboard/dashboard-sidebar.tsx");
    const page = read("app/(dashboard)/admin/page.tsx");
    expect(topbar).toContain("getDashboardNav(role)");
    expect(sidebar).toContain("getDashboardNav(role)");
    expect(sidebar).toContain("<Dialog.Portal>");
    expect(page).toContain("adminOverviewRepository.getOverview()");
    expect(page).not.toContain('href="#"');
  });
});
