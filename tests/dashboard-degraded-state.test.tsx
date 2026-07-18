import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import AdminDashboardError from "@/app/(dashboard)/admin/error";
import CoachDashboardError from "@/app/(dashboard)/coach/error";
import DashboardError from "@/app/(dashboard)/error";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

describe("dashboard degraded states", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  it.each([
    {
      label: "dashboard layout",
      render: (retry: () => void) => <DashboardError reset={retry} />,
      expected: "No empty totals, rosters, or schedules are being shown",
    },
    {
      label: "admin",
      render: (retry: () => void) => (
        <AdminDashboardError error={new Error("private database detail")} reset={retry} />
      ),
      expected: "No empty totals are being shown",
    },
    {
      label: "coach",
      render: (retry: () => void) => <CoachDashboardError reset={retry} />,
      expected: "No empty roster or session state is being shown",
    },
  ])("renders an honest $label outage and supports retry", async ({ render, expected }) => {
    const retry = vi.fn();
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);

    await act(async () => root.render(render(retry)));

    expect(document.body.textContent).toContain(expected);
    expect(document.body.textContent).not.toContain("private database detail");
    await act(async () => document.querySelector<HTMLButtonElement>("button")?.click());
    expect(retry).toHaveBeenCalledOnce();

    await act(async () => root.unmount());
  });
});
