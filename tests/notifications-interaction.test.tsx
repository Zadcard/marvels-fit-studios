import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  markAll: vi.fn(async () => undefined),
  markOne: vi.fn(async () => undefined),
  push: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("@/app/actions/notifications", () => ({
  markAllNotificationsRead: mocks.markAll,
  markNotificationRead: mocks.markOne,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));

import { MarvelOpsNotifications } from "@/components/dashboard/marvel-ops-notifications";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

const items = [
  {
    id: "notice-1",
    kind: "SYSTEM" as const,
    status: "SENT" as const,
    title: "Admin notice",
    body: "Review a member.",
    href: "/admin/clients",
    sentAt: "2026-07-18T08:00:00.000Z",
    readAt: null,
  },
  {
    id: "notice-2",
    kind: "SESSION_REMINDER" as const,
    status: "SENT" as const,
    title: "Parked portal notice",
    body: "This destination is not available to staff.",
    href: "/client/sessions",
    sentAt: "2026-07-18T09:00:00.000Z",
    readAt: null,
  },
];

describe("notification interactions", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  it("persists reads before navigation and hides unsafe destinations", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);

    await act(async () => {
      root.render(<MarvelOpsNotifications role="admin" items={items} />);
    });

    const openButtons = Array.from(document.querySelectorAll("button")).filter(
      (button) => button.textContent?.includes("Open"),
    );
    expect(openButtons).toHaveLength(1);

    await act(async () => openButtons[0]?.click());
    expect(mocks.markOne).toHaveBeenCalledWith("notice-1");
    expect(mocks.push).toHaveBeenCalledWith("/admin/clients");

    await act(async () => root.unmount());
  });

  it("persists mark-all and refreshes the server data", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);

    await act(async () => {
      root.render(<MarvelOpsNotifications role="admin" items={items} />);
    });
    const markAll = Array.from(document.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Mark all read"),
    );
    await act(async () => markAll?.click());

    expect(mocks.markAll).toHaveBeenCalledOnce();
    expect(mocks.refresh).toHaveBeenCalledOnce();

    await act(async () => root.unmount());
  });
});
