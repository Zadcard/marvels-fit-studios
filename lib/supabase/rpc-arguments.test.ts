import { describe, expect, it } from "vitest";

import { nullableRpcString } from "@/lib/supabase/rpc-arguments";

describe("nullable RPC string arguments", () => {
  it("passes populated dates and IDs through", () => {
    expect(nullableRpcString("2026-08-31")).toBe("2026-08-31");
    expect(nullableRpcString(" 9d068381-7454-49dd-997a-1d8b738c75b3 ")).toBe(
      "9d068381-7454-49dd-997a-1d8b738c75b3",
    );
  });

  it("turns missing optional values into SQL null rather than empty strings", () => {
    expect(nullableRpcString("")).toBeNull();
    expect(nullableRpcString("   ")).toBeNull();
    expect(nullableRpcString(null)).toBeNull();
    expect(nullableRpcString(undefined)).toBeNull();
  });
});
