import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  save: vi.fn(async () => undefined),
  refresh: vi.fn(),
}));

vi.mock("@/app/actions/coach-settings", () => ({
  saveCoachSettings: mocks.save,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));

import { CoachSettingsWorkspace } from "@/components/dashboard/coach-settings-workspace";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

describe("coach settings workspace", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  it("persists the current live coach profile", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    await act(async () => root.render(<CoachSettingsWorkspace settings={{
      fullName: "Coach One",
      roleLabel: "Coach",
      email: "coach@example.com",
      phone: "+201000000000",
      bio: "",
      specialization: "Football",
      preferredView: "Sessions list",
      reminderLeadTime: "30 minutes",
      availabilityNote: "",
      mobileAlerts: true,
      clientCheckIns: true,
      waitlistFlags: true,
    }} />));

    await act(async () => document.querySelector<HTMLFormElement>("form")?.requestSubmit());
    expect(mocks.save).toHaveBeenCalledWith({
      fullName: "Coach One",
      email: "coach@example.com",
      phone: "+201000000000",
      specialization: "Football",
    });
    expect(mocks.refresh).toHaveBeenCalledOnce();
    expect(document.body.textContent).toContain("Coach profile saved.");

    await act(async () => root.unmount());
  });
});
