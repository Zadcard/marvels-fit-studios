import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const globals = readFileSync(resolve(root, "app/globals.css"), "utf8");
const fonts = readFileSync(resolve(root, "app/fonts.ts"), "utf8");
const preview = readFileSync(
  resolve(root, "app/(dashboard)/design-system/page.tsx"),
  "utf8",
);

function declaration(source: string, property: string) {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = source.match(new RegExp(`${escaped}\\s*:\\s*([^;]+);`));
  expect(match, `Missing CSS declaration for ${property}`).not.toBeNull();
  return match?.[1].trim().replace(/\s+/g, " ").toLowerCase();
}

describe("Marvel Fit light design-system contract", () => {
  it("keeps the handoff palette exact", () => {
    const tokens = {
      "--mv-primary": "#e62429",
      "--mv-primary-deep": "#c21c21",
      "--mv-primary-dark": "#a3161a",
      "--mv-primary-soft": "#fbe0dd",
      "--mv-primary-tint": "#fdece9",
      "--mv-ink": "#1c1916",
      "--mv-ink-2": "#37322c",
      "--mv-body": "#4a443d",
      "--mv-muted": "#8b857e",
      "--mv-muted-2": "#948d85",
      "--mv-faint": "#b6afa7",
      "--mv-backdrop": "#e3e0dd",
      "--mv-app-bg": "#f1efec",
      "--mv-card": "#ffffff",
      "--mv-border": "#edecea",
      "--mv-hover": "#faf8f5",
      "--mv-tab-track": "#f5f3f0",
      "--mv-success": "#1f9d63",
      "--mv-warning": "#ef7c37",
      "--mv-amber": "#e6c33f",
      "--mv-critical": "#e5484d",
    } as const;

    for (const [token, expected] of Object.entries(tokens)) {
      expect(declaration(globals, token)).toBe(expected);
    }
  });

  it("keeps the handoff radii and one primary preview action", () => {
    expect(declaration(globals, "--mv-radius-shell")).toBe("34px");
    expect(declaration(globals, "--mv-radius-card")).toBe("22px");
    expect(declaration(globals, "--mv-radius-control")).toBe("13px");
    expect(declaration(globals, "--mv-radius-chip")).toBe("11px");
    expect(preview.match(/mv-btn-primary/g)).toHaveLength(1);
  });

  it("uses the two approved font families", () => {
    expect(fonts).toContain("Manrope");
    expect(fonts).toContain("Space_Grotesk");
    expect(fonts).not.toContain("Hanken_Grotesk");
  });

  it("does not reintroduce the older dark redesign tokens", () => {
    expect(globals).not.toContain("#0A0A0B");
    expect(globals).not.toContain("#0C0C0D");
    expect(globals).not.toContain("#FFD9D8");
  });

  it("keeps touch targets and reduced-motion handling in the foundation", () => {
    expect(globals).toMatch(/\.mv-btn\s*{[\s\S]*?min-height:\s*44px;/);
    expect(globals).toMatch(/\.mv-icon-btn\s*{[\s\S]*?width:\s*44px;/);
    expect(globals).toMatch(/\.mv-icon-btn\s*{[\s\S]*?height:\s*44px;/);
    expect(globals).toContain("@media (prefers-reduced-motion: reduce)");
  });
});
