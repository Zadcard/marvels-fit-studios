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
    expect(globals).not.toContain("--mv-");
  });

  it("removes the legacy dashboard component layer", () => {
    expect(() => read("components/dashboard/dashboard-mini-stat.tsx")).toThrow();
    expect(() => read("components/dashboard/dashboard-modal.tsx")).toThrow();
    expect(() => read("components/dashboard/dashboard-page-header.tsx")).toThrow();
    expect(() => read("components/dashboard/dashboard-stat-card.tsx")).toThrow();
    expect(() => read("components/ui/metric-card.tsx")).toThrow();
  });

  it("gives public and auth routes their own REDLINE compositions", () => {
    const landing = read("app/page.tsx");
    const landingStyles = read("app/landing.css");
    const authShell = read("components/auth/redline-auth-shell.tsx");
    const authStyles = read("app/login/login.css");
    expect(landing).toContain("Train like the plan matters");
    expect(landingStyles).toContain("var(--rl-red)");
    expect(landingStyles).not.toContain("var(--mv-");
    expect(authShell).toContain("Your work starts before the first rep");
    expect(authStyles).toContain("var(--rl-ink)");
    expect(authStyles).not.toContain("var(--mv-");
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
