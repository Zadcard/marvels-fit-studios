import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  record: vi.fn(async (input: unknown) => {
    void input;
    return { id: "expense-1" };
  }),
  refresh: vi.fn(),
}));

vi.mock("@/app/actions/admin-expenses", () => ({
  recordStudioExpense: mocks.record,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));

import { AdminCashOutDialog } from "@/components/dashboard/admin-cash-out-dialog";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

function setInput(input: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const prototype = input instanceof HTMLTextAreaElement
    ? HTMLTextAreaElement.prototype
    : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(prototype, "value")?.set?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

describe("admin cash-out dialog", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  it("records the form through the guarded expense action", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    await act(async () => root.render(<AdminCashOutDialog />));
    await act(async () => document.querySelector<HTMLButtonElement>("button")?.click());

    const amount = document.querySelector<HTMLInputElement>('input[name="amount"]');
    const description = document.querySelector<HTMLTextAreaElement>('textarea[name="description"]');
    if (amount) setInput(amount, "275.50");
    if (description) setInput(description, "Studio supplies");
    await act(async () => document.querySelector<HTMLFormElement>("form")?.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    ));

    expect(mocks.record).toHaveBeenCalledOnce();
    expect(mocks.record.mock.calls[0]?.[0]).toMatchObject({
      amount: 275.5,
      currency: "EGP",
      category: "SUPPLIES",
      paymentMethod: "CASH",
      description: "Studio supplies",
    });
    expect(document.body.textContent).toContain("included in reports");
    expect(mocks.refresh).toHaveBeenCalledOnce();

    await act(async () => root.unmount());
  });
});
