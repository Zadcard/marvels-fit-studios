import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("Marvel Ops canonical workspaces", () => {
  it("keeps only the designed admin routes in the active navigation", () => {
    const navigation = read("lib/navigation/dashboard-nav.ts");
    for (const label of ["Today", "Attendance", "Schedule", "Leads & Trials", "Clients", "Groups", "Coaches", "Subscriptions"]) {
      expect(navigation).toContain(`label: "${label}"`);
    }
  });

  it("implements the reference attendance interactions locally", () => {
    const workspace = read("components/dashboard/admin-attendance-workspace.tsx");
    expect(workspace).toContain("Mark all in");
    expect(workspace).toContain("stopPropagation");
    expect(workspace).toContain('status: "Late"');
  });

  it("keeps full client management and cash-out in the operations design", () => {
    const clientPage = read("app/(dashboard)/admin/clients/page.tsx");
    const clientWorkspace = read("components/dashboard/admin-clients-workspace.tsx");
    expect(clientPage).toContain("AdminClientsWorkspace");
    expect(clientWorkspace).toContain("saveAdminClient");
    expect(clientWorkspace).toContain("deleteAdminClient");
    expect(clientWorkspace).toContain("<Dialog.Portal>");
    expect(read("components/dashboard/marvel-ops-admin-view.tsx")).not.toContain(
      "Client creation will be connected",
    );
    expect(read("components/dashboard/admin-cash-out-dialog.tsx")).toContain("Record cash out");
  });

  it("removes public landing and client portal rendering files", () => {
    expect(existsSync(resolve(root, "app/landing.css"))).toBe(false);
    expect(existsSync(resolve(root, "components/landing/landing-sections.tsx"))).toBe(false);
    expect(existsSync(resolve(root, "components/dashboard/client-overview-workspace.tsx"))).toBe(false);
  });
});
