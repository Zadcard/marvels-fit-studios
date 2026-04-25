import { act } from "react";
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AdminBulkImportWorkspace } from "./admin-bulk-import-workspace";

vi.mock("@/app/actions/admin-bulk-import", () => ({
  importClientCSV: vi.fn(),
  previewClientImportCSV: vi.fn(async () => []),
}));

describe("AdminBulkImportWorkspace", () => {
  let root: ReturnType<typeof createRoot> | null = null;
  let container: HTMLDivElement | null = null;

  afterEach(() => {
    if (root) {
      act(() => {
        root?.unmount();
      });
    }
    container?.remove();
    root = null;
    container = null;
  });

  it("renders the expected bulk import controls and report labels", () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    act(() => {
      root?.render(createElement(AdminBulkImportWorkspace));
    });

    expect(container.textContent).toContain("Drop CSV here or click to upload");
    expect(container.textContent).toContain(
      "Expected columns: fullName,groupName,phone"
    );
    expect(container.textContent).toContain("Import All");
    expect(container.textContent).toContain("Success rate");
  });
});
