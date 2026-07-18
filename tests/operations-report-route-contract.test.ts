import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const route = readFileSync(resolve(process.cwd(), "app/api/reports/operations/route.ts"), "utf8");

describe("operations report export route", () => {
  it("returns explicit authentication responses and private CSV output", () => {
    expect(route).toContain("getRouteUserOrNull()");
    expect(route).toContain('status: 401');
    expect(route).toContain('status: 403');
    expect(route).toContain('user.role !== UserRole.ADMIN');
    expect(route).toContain('"cache-control": "private, no-store"');
    expect(route).toContain('"content-type": "text/csv; charset=utf-8"');
  });
});
