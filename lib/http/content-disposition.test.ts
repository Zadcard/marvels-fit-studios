import { describe, expect, it } from "vitest";

import { attachmentContentDisposition } from "@/lib/http/content-disposition";

describe("attachmentContentDisposition", () => {
  it("provides safe ASCII and UTF-8 filename parameters", () => {
    expect(attachmentContentDisposition('progress "July" تقرير.pdf')).toBe(
      "attachment; filename=\"progress _July_ _____.pdf\"; filename*=UTF-8''progress%20%22July%22%20%D8%AA%D9%82%D8%B1%D9%8A%D8%B1.pdf",
    );
  });

  it("does not allow path separators or an empty fallback", () => {
    expect(attachmentContentDisposition("../report.pdf")).toContain(
      'filename=".._report.pdf"',
    );
    expect(attachmentContentDisposition("   ")).toContain(
      'filename="download"',
    );
  });
});
