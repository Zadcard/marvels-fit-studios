import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/leads/landing-lead-store", () => ({
  landingLeadStore: {
    listPendingCredentialMessages: vi.fn(),
    phoneExists: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock("@/lib/services/client-id-generator", () => ({
  clientIdGenerator: {
    generateId: vi.fn(),
    getNextAvailableSlot: vi.fn(),
  },
}));

vi.mock("@/lib/services/password-generator", () => ({
  passwordGenerator: {
    generatePassword: vi.fn(),
  },
}));

describe("landing lead action", () => {
  let leadStore: typeof import("@/lib/leads/landing-lead-store").landingLeadStore;
  let submitJoinNowLead: typeof import("@/app/actions/landing").submitJoinNowLead;
  let initialJoinNowState: typeof import("@/app/actions/join-now-types").initialJoinNowState;
  let clientIdGenerator: typeof import("@/lib/services/client-id-generator").clientIdGenerator;
  let passwordGenerator: typeof import("@/lib/services/password-generator").passwordGenerator;

  beforeEach(async () => {
    vi.clearAllMocks();
    leadStore = (await import("@/lib/leads/landing-lead-store")).landingLeadStore;
    clientIdGenerator = (await import("@/lib/services/client-id-generator"))
      .clientIdGenerator;
    passwordGenerator = (await import("@/lib/services/password-generator"))
      .passwordGenerator;
    ({ submitJoinNowLead } = await import("@/app/actions/landing"));
    ({ initialJoinNowState } = await import("@/app/actions/join-now-types"));
  });

  it("stores a lead with reserved credentials and waits for admin approval before account creation", async () => {
    vi.mocked(leadStore.phoneExists).mockResolvedValue({ client: false, lead: false });
    vi.mocked(leadStore.listPendingCredentialMessages).mockResolvedValue([]);
    vi.mocked(clientIdGenerator.getNextAvailableSlot).mockResolvedValue({
      year: 2026,
      month: 5,
      clientNumber: 1,
    });
    vi.mocked(clientIdGenerator.generateId).mockReturnValue("2605001");
    vi.mocked(passwordGenerator.generatePassword).mockReturnValue("MFS_2605001");

    const formData = new FormData();
    formData.set("name", "John Doe");
    formData.set("phone", "01012345678");

    const result = await submitJoinNowLead(initialJoinNowState, formData);

    expect(leadStore.create).toHaveBeenCalledWith(
      expect.objectContaining({
        fullName: "John Doe",
        phone: "+201012345678",
        message: "__join_credentials__:2605001",
        status: "NEW",
        source: "landing-join-now",
      })
    );
    expect(result.status).toBe("success");
    expect(result.credentials).toEqual({
      clientId: "2605001",
      password: "MFS_2605001",
      fullName: "John Doe",
      phone: "+201012345678",
    });
  });

  it("does not create duplicate pending leads", async () => {
    vi.mocked(leadStore.phoneExists).mockResolvedValue({ client: false, lead: true });
    vi.mocked(leadStore.listPendingCredentialMessages).mockResolvedValue([]);

    const formData = new FormData();
    formData.set("name", "John Doe");
    formData.set("phone", "01012345678");

    const result = await submitJoinNowLead(initialJoinNowState, formData);

    expect(leadStore.create).not.toHaveBeenCalled();
    expect(result.status).toBe("error");
  });
});
