import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("Marvel Ops foundation", () => {
  it("uses the reference dark palette, typography, and shell", () => {
    const globals = read("app/globals.css");
    const shell = read("app/(dashboard)/redline-shell.css");
    const fonts = read("app/fonts.ts");
    expect(globals).toContain("--rl-canvas: #050505");
    expect(shell).toContain("--ops-bg: #050505");
    expect(shell).toContain("--ops-red: #e62429");
    for (const font of ["Manrope", "Space_Grotesk", "JetBrains_Mono", "Archivo_Black"]) expect(fonts).toContain(font);
  });

  it("uses the operations-only entry and auth shell", () => {
    expect(read("app/page.tsx")).toContain('redirect(session?.user?.role');
    expect(read("components/auth/ops-auth-shell.tsx")).toContain("Admin & coach workspace");
    expect(read("app/login/login.css")).toContain("#e62429");
  });
});
