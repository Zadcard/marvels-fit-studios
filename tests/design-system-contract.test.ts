import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const globals = readFileSync(resolve(root, "app/globals.css"), "utf8");
const dashboardShell = readFileSync(
  resolve(root, "app/(dashboard)/dashboard-shell.css"),
  "utf8",
);
const dashboardV2 = readFileSync(
  resolve(root, "app/(dashboard)/marvel-dashboard-v2.css"),
  "utf8",
);
const dashboardLayout = readFileSync(
  resolve(root, "app/(dashboard)/layout.tsx"),
  "utf8",
);
const adminOverview = readFileSync(
  resolve(root, "components/dashboard/admin-overview-screen.tsx"),
  "utf8",
);
const adminSchedule = readFileSync(
  resolve(root, "components/dashboard/admin-schedule-workspace.tsx"),
  "utf8",
);
const previewPage = readFileSync(
  resolve(root, "app/(dashboard)/design-system/page.tsx"),
  "utf8",
);

const compact = (value: string) => value.replace(/\s+/g, "").toLowerCase();

function declaration(source: string, property: string) {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = source.match(new RegExp(`${escaped}\\s*:\\s*([^;]+);`));

  expect(match, `Missing CSS declaration for ${property}`).not.toBeNull();
  return compact(match?.[1] ?? "");
}

function block(source: string, selector: string) {
  const start = source.indexOf(selector);
  expect(start, `Missing CSS selector ${selector}`).toBeGreaterThanOrEqual(0);

  const open = source.indexOf("{", start);
  const close = source.indexOf("}", open);
  return compact(source.slice(open + 1, close));
}

describe("Marvel Fit handoff design-system contract", () => {
  it("keeps the README palette and radius tokens exact", () => {
    const tokens = {
      "--mv-canvas": "#0A0A0B",
      "--mv-canvas-alt": "#1B1B1C",
      "--mv-panel": "#0C0C0D",
      "--mv-surface": "#161618",
      "--mv-surface-2": "#222225",
      "--mv-primary": "#E62429",
      "--mv-primary-deep": "#B91C21",
      "--mv-primary-bright": "#FF5A5E",
      "--mv-primary-tint": "#FF6B6E",
      "--mv-primary-gradient": "linear-gradient(135deg, #E62429, #C11F24)",
      "--mv-primary-wash": "rgba(230, 36, 41, 0.14)",
      "--mv-rose": "#FFD9D8",
      "--mv-rose-deep": "#F3C9C8",
      "--mv-mint": "#DCEFE2",
      "--mv-lavender": "#E7E2F7",
      "--mv-peach": "#FBE8CE",
      "--mv-pastel-text": "#1D0809",
      "--mv-text": "#FFFFFF",
      "--mv-text-2": "#C9C4C4",
      "--mv-muted": "#928C8C",
      "--mv-muted-2": "#6E6868",
      "--mv-line": "rgba(255, 255, 255, 0.06)",
      "--mv-line-strong": "rgba(255, 255, 255, 0.10)",
      "--mv-control": "rgba(255, 255, 255, 0.05)",
      "--mv-control-hover": "rgba(255, 255, 255, 0.10)",
      "--mv-success": "#7ED9A2",
      "--mv-danger": "#FF6B6E",
      "--r-pill": "999px",
      "--r-panel-lg": "28px",
      "--r-panel": "22px",
      "--r-surface": "20px",
      "--r-control": "14px",
      "--r-chip": "12px",
      "--r-icon": "11px",
    } as const;

    for (const [name, expected] of Object.entries(tokens)) {
      expect(declaration(globals, name)).toBe(compact(expected));
    }
  });

  it("maps the handoff layers and radii into the Tailwind v4 theme", () => {
    const mappings = {
      "--color-canvas": "var(--mv-canvas)",
      "--color-canvas-alt": "var(--mv-canvas-alt)",
      "--color-panel": "var(--mv-panel)",
      "--color-surface": "var(--mv-surface)",
      "--color-surface-2": "var(--mv-surface-2)",
      "--color-rose": "var(--mv-rose)",
      "--color-mint": "var(--mv-mint)",
      "--color-lavender": "var(--mv-lavender)",
      "--color-peach": "var(--mv-peach)",
      "--radius-panel": "var(--r-panel)",
      "--radius-surface": "var(--r-surface)",
      "--radius-control": "var(--r-control)",
    } as const;

    for (const [name, expected] of Object.entries(mappings)) {
      expect(declaration(globals, name)).toBe(compact(expected));
    }
  });

  it("keeps the shared button and input metrics faithful and flat", () => {
    const button = block(globals, ".mv-btn {");
    const outline = block(globals, ".mv-btn-outline {");
    const field = block(globals, ".mv-field {");
    const fieldFocus = block(globals, ".mv-field:focus-visible {");
    const invalidField = block(globals, '.mv-field[aria-invalid="true"]');

    expect(button).toContain("padding:15px28px;");
    expect(button).toContain("border-radius:999px;");
    expect(button).toContain("font-size:12px;");
    expect(button).toContain("font-weight:800;");
    expect(button).toContain("letter-spacing:0.075em;");
    expect(outline).toContain("border-color:rgba(255,255,255,0.16);");
    expect(field).toContain("padding:15px18px;");
    expect(field).toContain("border:1pxsolidrgba(255,255,255,0.09);");
    expect(field).toContain("border-radius:var(--r-control);");
    expect(field).toContain("box-shadow:none;");
    expect(fieldFocus).toContain("box-shadow:0003pxrgba(230,36,41,0.22);");
    expect(invalidField).toContain("box-shadow:none;");
  });

  it("keeps the KPI and panel contracts on contrast-only layers", () => {
    const checkpointStart = dashboardShell.search(
      /\.dashboard-panel,\s*\.dashboard-stat-card,/,
    );
    expect(checkpointStart).toBeGreaterThanOrEqual(0);
    const checkpointRules = dashboardShell.slice(checkpointStart);
    const sharedCards = block(checkpointRules, ".dashboard-panel,");
    const panel = block(checkpointRules, ".dashboard-panel {");
    const statCard = block(checkpointRules, ".dashboard-stat-card {");
    const statIcon = block(checkpointRules, ".dashboard-stat-card__icon {");
    const statValue = block(checkpointRules, ".dashboard-stat-card__value {");

    expect(sharedCards).toContain("border:0;");
    expect(sharedCards).toContain("border-radius:var(--r-panel);");
    expect(sharedCards).toContain("background:var(--mv-panel);");
    expect(sharedCards).toContain("box-shadow:none;");
    expect(panel).toContain("padding:var(--mv-space-xl);");
    expect(statCard).toContain("padding:var(--mv-space-xl);");
    expect(statIcon).toContain("width:44px;");
    expect(statIcon).toContain("height:44px;");
    expect(statIcon).toContain("border-radius:var(--r-control);");
    expect(statValue).toContain("font-size:27px;");
    expect(statValue).toContain("font-weight:800;");
  });

  it("enforces the preview red budget and keeps pastels out of buttons", () => {
    expect(previewPage.match(/data-red-cta/g)).toHaveLength(1);
    expect(previewPage.match(/mv-btn-primary/g)).toHaveLength(1);

    const buttonContracts = globals.slice(
      globals.indexOf("/* Buttons"),
      globals.indexOf("/* Form Fields"),
    );

    expect(buttonContracts).not.toMatch(
      /--mv-(?:rose|rose-deep|mint|lavender|peach)/,
    );
  });

  it("loads the approved dashboard layer after the legacy shell", () => {
    expect(dashboardLayout.indexOf("./dashboard-shell.css")).toBeGreaterThanOrEqual(0);
    expect(dashboardLayout.indexOf("./marvel-dashboard-v2.css")).toBeGreaterThan(
      dashboardLayout.indexOf("./dashboard-shell.css"),
    );
    expect(dashboardV2).toContain("grid-template-columns: 248px minmax(0, 1fr)");
    expect(dashboardV2).toContain("grid-template-columns: 332px minmax(0, 1fr)");
    expect(dashboardV2).toContain("grid-template-columns: minmax(0, 1fr) 400px");
  });

  it("keeps each rebuilt screen to one primary action", () => {
    expect(adminOverview.match(/mv-btn-primary/g)).toHaveLength(1);
    expect(adminSchedule.match(/mv-btn-primary/g)).toHaveLength(1);
    expect(adminSchedule).not.toContain("mv-btn-danger");
  });

  it("groups the full filtered schedule instead of a paginated subset", () => {
    expect(adminSchedule).toContain("for (const record of filteredRecords)");
    expect(adminSchedule).not.toContain("paginatedRecords.items");
  });

  it("keeps dashboard shadows flat except for the exact focus ring", () => {
    const allowed = new Set([
      "none",
      "0 0 0 3px rgba(230, 36, 41, 0.22)",
    ].map(compact));

    for (const source of [dashboardShell, dashboardV2]) {
      const shadows = [...source.matchAll(/box-shadow\s*:\s*([^;]+);/g)].map(
        ([, value]) => compact(value),
      );

      expect(shadows.length).toBeGreaterThan(0);
      for (const shadow of shadows) {
        expect(allowed.has(shadow), `Unexpected dashboard shadow: ${shadow}`).toBe(true);
      }
    }
  });
});
