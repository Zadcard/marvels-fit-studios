import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/join-requests",
  useRouter: () => ({ refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/app/actions/admin-leads", () => ({
  approveLeadAsClient: vi.fn(),
  assignLeadTrial: vi.fn(),
  completeLeadTrial: vi.fn(),
  createAdminLead: vi.fn(),
}));

import {
  MarvelOpsAdminView,
  type MarvelOpsLead,
} from "@/components/dashboard/marvel-ops-admin-view";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

const initial: MarvelOpsLead = {
  id: "lead-1",
  stage: "New",
  name: "Amina Test",
  initials: "AT",
  tone: "red",
  source: "Other",
  phone: "+201000000000",
  wants: "Trial consultation",
  note: "Original note",
};

describe("Marvel Ops lead prop refresh", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  it("reconciles an open lead drawer when refreshed server props change", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);

    await act(async () => root.render(
      <MarvelOpsAdminView view="leads" initialLeads={[initial]} trialGroups={[]} />,
    ));
    await act(async () => document.querySelector<HTMLElement>('article[role="button"]')?.click());
    expect(document.body.textContent).toContain("Original note");

    await act(async () => root.render(
      <MarvelOpsAdminView
        view="leads"
        initialLeads={[{ ...initial, stage: "Trial booked", note: "Refreshed note" }]}
        trialGroups={[]}
      />,
    ));

    expect(document.body.textContent).toContain("Refreshed note");
    expect(document.body.textContent).toContain("Trial booked");
    await act(async () => root.unmount());
  });
});
