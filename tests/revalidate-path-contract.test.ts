import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const actionsDirectory = resolve(process.cwd(), "app/actions");
const actionFiles = readdirSync(actionsDirectory)
  .filter((file) => file.endsWith(".ts") && !file.endsWith(".test.ts"))
  .map((file) => ({
    file,
    source: readFileSync(resolve(actionsDirectory, file), "utf8"),
  }));

const livePaths = new Set([
  "/admin",
  "/admin/attendance",
  "/admin/categories",
  "/admin/clients",
  "/admin/coaches",
  "/admin/groups",
  "/admin/join-requests",
  "/admin/leads",
  "/admin/notifications",
  "/admin/reports",
  "/admin/schedule",
  "/admin/settings",
  "/admin/subscriptions",
  "/change-password",
  "/coach",
  "/coach/alerts",
  "/coach/clients",
  "/coach/categories",
  "/coach/schedule",
  "/coach/sessions",
  "/coach/settings",
]);

describe("server-action cache invalidation", () => {
  it("targets only routes that still render in the application", () => {
    const targets = actionFiles.flatMap(({ file, source }) =>
      [...source.matchAll(/revalidatePath\((?:"([^"]+)"|`([^`]+)`)\)/g)].map(
        (match) => ({ file, path: match[1] ?? match[2] }),
      ),
    );

    expect(targets.length).toBeGreaterThan(0);
    for (const target of targets) {
      expect(livePaths.has(target.path), `${target.file}: ${target.path}`).toBe(true);
    }
  });

  it("refreshes the live views affected by schedule mutations", () => {
    const recurring = readFileSync(
      resolve(actionsDirectory, "admin-recurring-sessions.ts"),
      "utf8",
    );
    expect(recurring).toContain('revalidatePath("/admin/categories")');

    for (const file of [
      "admin-attendance.ts",
      "admin-session-bookings.ts",
      "admin-sessions.ts",
      "coach-session-bookings.ts",
    ]) {
      const source = readFileSync(resolve(actionsDirectory, file), "utf8");
      expect(source, file).toContain('revalidatePath("/admin/attendance")');
    }
  });
});
