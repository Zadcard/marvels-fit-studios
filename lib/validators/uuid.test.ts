import { describe, expect, it } from "vitest";

import { isUuid } from "@/lib/validators/uuid";

describe("isUuid", () => {
  it("accepts opaque UUID identifiers", () => {
    expect(isUuid("00000000-0000-0000-0000-000000000000")).toBe(true);
    expect(isUuid("D9428888-122B-11E1-B85C-61CD3CBB3210")).toBe(true);
  });

  it("rejects values that would make UUID database filters throw", () => {
    expect(isUuid("not-a-real-id")).toBe(false);
    expect(isUuid("../receipt")).toBe(false);
  });
});
