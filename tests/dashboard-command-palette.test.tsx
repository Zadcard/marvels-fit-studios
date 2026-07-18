import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

import { DashboardCommandPalette } from "@/components/dashboard/dashboard-command-palette";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

describe("dashboard command palette", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    push.mockReset();
  });

  it("renders only supplied live people and real admin actions", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);

    await act(async () => {
      root.render(
        <DashboardCommandPalette
          role="admin"
          open
          onClose={vi.fn()}
          commandItems={[
            {
              id: "client-live",
              label: "Live Client",
              detail: "GENERAL FITNESS · ACTIVE",
              kind: "Client",
              href: "/admin/clients?q=Live%20Client",
              initials: "LC",
            },
          ]}
        />,
      );
    });

    expect(document.body.textContent).toContain("Live Client");
    expect(document.body.textContent).not.toContain("Omar Tarek");
    expect(document.body.textContent).not.toContain("Record cash out");

    const newMember = Array.from(document.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("New member"),
    );
    await act(async () => newMember?.click());
    expect(push).toHaveBeenCalledWith("/admin/clients?new=1");

    await act(async () => root.unmount());
  });

  it("does not expose admin actions or unsupplied clients to coaches", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);

    await act(async () => {
      root.render(
        <DashboardCommandPalette
          role="coach"
          open
          onClose={vi.fn()}
          commandItems={[]}
        />,
      );
    });

    expect(document.body.textContent).not.toContain("Actions");
    expect(document.body.textContent).not.toContain("Mark attendance");
    expect(document.body.textContent).not.toContain("Omar Tarek");

    await act(async () => root.unmount());
  });
});
