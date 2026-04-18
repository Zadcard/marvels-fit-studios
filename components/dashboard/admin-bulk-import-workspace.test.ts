import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("AdminBulkImportWorkspace source", () => {
  it("renders the expected bulk import controls and report labels", () => {
    const source = readFileSync(
      "components/dashboard/admin-bulk-import-workspace.tsx",
      "utf8"
    );

    expect(source).toContain("Drop CSV here or click to upload");
    expect(source).toContain("Expected columns: fullName,phone");
    expect(source).toContain("Import All");
    expect(source).toContain("Download credentials CSV");
    expect(source).toContain("Success rate");
  });
});
