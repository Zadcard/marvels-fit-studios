import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  markAllAttendance: vi.fn(async () => undefined),
  markAttendance: vi.fn(async () => undefined),
  refresh: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("@/app/actions/admin-attendance", () => ({
  markAllAttendance: mocks.markAllAttendance,
  markAttendance: mocks.markAttendance,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh, replace: mocks.replace }),
  useSearchParams: () => new URLSearchParams(),
}));

import { AdminAttendanceWorkspace } from "@/components/dashboard/admin-attendance-workspace";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

describe("admin attendance interactions", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  it("persists clearing an existing check-in and omits unsupported controls", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);

    await act(async () => {
      root.render(
        <AdminAttendanceWorkspace
          dataSource="live"
          sessions={[
            {
              id: "session-1",
              title: "Strength",
              timeLabel: "10:00 AM",
              coachName: "Coach One",
              sessionType: "Group",
              trainingCategory: "STRENGTH",
              location: "Studio",
              attendees: [
                {
                  clientId: "client-1",
                  fullName: "Member One",
                  status: "Attended",
                  isTrial: false,
                  hasInjuryAlert: false,
                  injuryStatus: "None",
                  injuryNotes: "",
                },
              ],
            },
          ]}
        />,
      );
    });

    expect(document.body.textContent).not.toContain("Send summary to coach");
    expect(document.body.textContent).not.toContain("Late");
    const attendee = document.querySelector<HTMLElement>('article[role="button"]');
    await act(async () => attendee?.click());

    expect(mocks.markAttendance).toHaveBeenCalledWith(
      "session-1",
      "client-1",
      "BOOKED",
    );
    expect(mocks.refresh).toHaveBeenCalledOnce();

    await act(async () => root.unmount());
  });

  it("checks in the pending roster with one atomic action", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);

    await act(async () => {
      root.render(
        <AdminAttendanceWorkspace
          dataSource="live"
          sessions={[
            {
              id: "session-1",
              title: "Strength",
              timeLabel: "10:00 AM",
              coachName: "Coach One",
              sessionType: "Group",
              trainingCategory: "STRENGTH",
              location: "Studio",
              attendees: ["client-1", "client-2"].map((clientId, index) => ({
                clientId,
                fullName: `Member ${index + 1}`,
                status: "Booked" as const,
                isTrial: false,
                hasInjuryAlert: false,
                injuryStatus: "None",
                injuryNotes: "",
              })),
            },
          ]}
        />,
      );
    });

    const button = Array.from(document.querySelectorAll("button")).find(
      (candidate) => candidate.textContent?.includes("Mark all in"),
    );
    await act(async () => button?.click());

    expect(mocks.markAllAttendance).toHaveBeenCalledOnce();
    expect(mocks.markAllAttendance).toHaveBeenCalledWith(
      "session-1",
      ["client-1", "client-2"],
      "ATTENDED",
    );
    expect(mocks.markAttendance).not.toHaveBeenCalled();
    expect(mocks.refresh).toHaveBeenCalledOnce();

    await act(async () => root.unmount());
  });
});
