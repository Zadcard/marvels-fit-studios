import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  assign: vi.fn(async () => undefined),
  attendance: vi.fn(async () => undefined),
  remove: vi.fn(async () => undefined),
  saveNote: vi.fn(async () => ({ content: "Updated note" })),
  refresh: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("@/app/actions/coach-session-bookings", () => ({
  assignCoachClientToSession: mocks.assign,
  markCoachSessionAttendance: mocks.attendance,
  removeCoachClientFromSession: mocks.remove,
}));
vi.mock("@/app/actions/coach-session-notes", () => ({
  saveCoachSessionNote: mocks.saveNote,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh, replace: mocks.replace }),
}));

import { CoachSessionWorkspace } from "@/components/dashboard/coach-session-workspace";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

const session = {
  id: "session-1",
  title: "Strength",
  sessionType: "Group" as const,
  status: "Ready" as const,
  dayLabel: "Today",
  timeLabel: "10:00 AM",
  durationLabel: "60 min",
  isLive: false,
  location: "Studio",
  rosterLabel: "1 / 8 booked",
  bookedCount: 1,
  focus: "Strength focus",
  note: "Warm-up first",
  noteValue: "Warm-up first",
  bookings: [
    {
      clientId: "client-1",
      fullName: "Member One",
      status: "Booked" as const,
      injuryStatus: "None" as const,
      injuryNotes: "",
      restrictions: "",
      hasInjuryAlert: false,
    },
  ],
};

describe("coach session workspace", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  it("persists scoped attendance, roster, and note operations", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    await act(async () => root.render(
      <CoachSessionWorkspace
        sessions={[session]}
        clientOptions={[
          { id: "client-1", fullName: "Member One" },
          { id: "client-2", fullName: "Member Two" },
        ]}
      />,
    ));

    const checkInButton = Array.from(document.querySelectorAll("button")).find(
      (button) => button.textContent?.trim() === "In",
    );
    await act(async () => checkInButton?.click());
    expect(mocks.attendance).toHaveBeenCalledWith("session-1", "client-1", "ATTENDED");

    const select = document.querySelector<HTMLSelectElement>('select[aria-label="Client to add"]');
    await act(async () => {
      if (select) {
        select.value = "client-2";
        select.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
    const addButton = Array.from(document.querySelectorAll("button")).find(
      (button) => button.textContent?.trim() === "Add",
    );
    await act(async () => addButton?.click());
    expect(mocks.assign).toHaveBeenCalledWith("session-1", "client-2");

    const textarea = document.querySelector<HTMLTextAreaElement>("textarea");
    await act(async () => {
      if (textarea) {
        Object.getOwnPropertyDescriptor(
          HTMLTextAreaElement.prototype,
          "value",
        )?.set?.call(textarea, "Updated note");
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });
    await act(async () => document.querySelector<HTMLFormElement>("form")?.requestSubmit());
    expect(mocks.saveNote).toHaveBeenCalledWith("session-1", "Updated note");
    expect(mocks.refresh).toHaveBeenCalledTimes(3);

    await act(async () => root.unmount());
  });
});
