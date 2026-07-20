import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/leads/landing-lead-store", () => ({
  landingLeadStore: {
    phoneExists: vi.fn(),
    create: vi.fn(),
  },
}));

describe("landing lead action", () => {
  let leadStore: typeof import("@/lib/leads/landing-lead-store").landingLeadStore;
  let submitJoinNowLead: typeof import("@/app/actions/landing").submitJoinNowLead;
  let initialJoinNowState: typeof import("@/app/actions/join-now-types").initialJoinNowState;

  beforeEach(async () => {
    vi.clearAllMocks();
    leadStore = (await import("@/lib/leads/landing-lead-store")).landingLeadStore;
    ({ submitJoinNowLead } = await import("@/app/actions/landing"));
    ({ initialJoinNowState } = await import("@/app/actions/join-now-types"));
  });

  it("stores a lead and waits for admin follow-up before account creation", async () => {
    vi.mocked(leadStore.phoneExists).mockResolvedValue({ client: false, lead: false });

    const formData = new FormData();
    formData.set("name", "John Doe");
    formData.set("phone", "01012345678");

    const result = await submitJoinNowLead(initialJoinNowState, formData);

    expect(leadStore.create).toHaveBeenCalledWith(
      expect.objectContaining({
        fullName: "John Doe",
        phone: "+201012345678",
        status: "NEW",
        source: "landing-join-now",
      })
    );
    expect(result.status).toBe("success");
  });

  it("does not create duplicate pending leads", async () => {
    vi.mocked(leadStore.phoneExists).mockResolvedValue({ client: false, lead: true });

    const formData = new FormData();
    formData.set("name", "John Doe");
    formData.set("phone", "01012345678");

    const result = await submitJoinNowLead(initialJoinNowState, formData);

    expect(leadStore.create).not.toHaveBeenCalled();
    expect(result.status).toBe("error");
  });
});
