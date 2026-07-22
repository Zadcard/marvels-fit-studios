import { describe, expect, it } from "vitest";

import { databaseTextIdSchema } from "@/lib/validators/database-id";

describe("database text id validation", () => {
  it("accepts the text IDs used by existing client records", () => {
    expect(databaseTextIdSchema.parse("client-1")).toBe("client-1");
    expect(databaseTextIdSchema.parse("clx7m9p2a0001qwerty123456")).toBe(
      "clx7m9p2a0001qwerty123456",
    );
  });

  it("continues to accept UUID records", () => {
    expect(
      databaseTextIdSchema.parse("9d068381-7454-49dd-997a-1d8b738c75b3"),
    ).toBe("9d068381-7454-49dd-997a-1d8b738c75b3");
  });

  it("rejects blank and unbounded IDs", () => {
    expect(databaseTextIdSchema.safeParse("   ").success).toBe(false);
    expect(databaseTextIdSchema.safeParse("x".repeat(129)).success).toBe(false);
  });
});
