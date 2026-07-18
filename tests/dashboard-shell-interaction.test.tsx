import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin",
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: null }),
  signOut: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={String(href)} {...props}>{children}</a>
  ),
}));

vi.mock("next/image", () => ({
  default: ({ priority, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) => {
    void priority;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img {...props} alt={props.alt ?? ""} />
    );
  },
}));

import { DashboardRoleShell } from "@/components/dashboard/dashboard-role-shell";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

describe("dashboard mobile drawer interaction", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("opens from the shell control and closes with Escape", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);

    await act(async () => {
      root.render(
        <DashboardRoleShell role="admin">
          <p>Dashboard content</p>
        </DashboardRoleShell>,
      );
    });

    const openButton = document.querySelector<HTMLButtonElement>(
      'button[aria-label="Open navigation"]',
    );
    expect(openButton).not.toBeNull();

    await act(async () => {
      openButton?.click();
    });

    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    expect(openButton?.getAttribute("aria-expanded")).toBe("true");

    await act(async () => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });

    expect(document.querySelector('[role="dialog"]')).toBeNull();

    await act(async () => {
      root.unmount();
    });
  });
});
