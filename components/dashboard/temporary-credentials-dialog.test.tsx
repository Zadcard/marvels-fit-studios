import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TemporaryCredentialsDialog } from "@/components/dashboard/temporary-credentials-dialog";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

describe("TemporaryCredentialsDialog", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("shows and copies the one-time credential DTO", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);

    await act(async () => {
      root.render(
        <TemporaryCredentialsDialog
          credentials={{
            accountType: "client",
            signInId: "2607001",
            temporaryPassword: "Mfs9-random-temporary-value",
          }}
          onClose={vi.fn()}
        />,
      );
    });

    expect(document.querySelector('[role="dialog"]')?.textContent).toContain(
      "Client access created",
    );

    const copyButton = Array.from(document.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Copy credentials"),
    );
    await act(async () => {
      copyButton?.click();
    });

    expect(writeText).toHaveBeenCalledWith(
      "Sign-in: 2607001\nTemporary password: Mfs9-random-temporary-value",
    );
    expect(copyButton?.textContent).toContain("Copied");

    await act(async () => {
      root.unmount();
    });
  });
});
