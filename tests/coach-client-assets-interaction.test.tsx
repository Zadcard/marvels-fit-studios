import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  saveNote: vi.fn(async () => undefined),
  uploadFile: vi.fn(async (data: FormData) => {
    void data;
  }),
  refresh: vi.fn(),
  push: vi.fn(),
}));

vi.mock("@/app/actions/coach-client-assets", () => ({
  savePrivateClientNote: mocks.saveNote,
  uploadCoachFile: mocks.uploadFile,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh, push: mocks.push }),
}));

import { MarvelOpsCoachClients } from "@/components/dashboard/marvel-ops-coach-data";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

const client = {
  id: "client-1",
  fullName: "Member One",
  phone: "+201000000000",
  planType: "Group" as const,
  status: "On track" as const,
  trainingCategory: "Muscle gain" as const,
  injuryStatus: "None" as const,
  injuryNotes: "",
  restrictions: "",
  hasInjuryAlert: false,
  nextSession: "Tomorrow",
  lastTouchpoint: "Today",
  currentFocus: "Stable progression",
  progressNote: "Next session tomorrow.",
  groupId: "group-1",
  groupName: "Strength A",
  privateNotes: [],
  activeFiles: [],
};

describe("coach client assets", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  it("persists a private note and scopes a file upload to the selected client", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    await act(async () => root.render(<MarvelOpsCoachClients clients={[client]} />));

    const clientButton = Array.from(document.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Member One"),
    );
    await act(async () => clientButton?.click());
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();

    const textarea = document.querySelector<HTMLTextAreaElement>("textarea");
    await act(async () => {
      if (textarea) {
        Object.getOwnPropertyDescriptor(
          HTMLTextAreaElement.prototype,
          "value",
        )?.set?.call(textarea, "Private progress note");
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });
    await act(async () => textarea?.closest("form")?.requestSubmit());
    expect(mocks.saveNote).toHaveBeenCalledWith({
      clientId: "client-1",
      noteId: null,
      content: "Private progress note",
    });

    const uploadForm = document.querySelector<HTMLInputElement>('input[type="file"]')?.closest("form");
    await act(async () => uploadForm?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
    expect(mocks.uploadFile).toHaveBeenCalledOnce();
    const formData = mocks.uploadFile.mock.calls[0]?.[0] as FormData;
    expect(formData.get("scope")).toBe("client");
    expect(formData.get("targetId")).toBe("client-1");
    expect(mocks.refresh).toHaveBeenCalledTimes(2);

    await act(async () => root.unmount());
  });
});
