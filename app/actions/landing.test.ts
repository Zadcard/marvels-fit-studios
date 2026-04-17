import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  getPrisma: vi.fn(),
}));

vi.mock("@/lib/services/client-registration-service", () => ({
  clientRegistrationService: {
    isPhoneAvailable: vi.fn(),
    registerClient: vi.fn(),
  },
}));

describe("landing registration action", () => {
  let service: typeof import("@/lib/services/client-registration-service").clientRegistrationService;
  let registerClientWithAutoCredentials: typeof import("@/app/actions/landing").registerClientWithAutoCredentials;
  let initialJoinNowState: typeof import("@/app/actions/join-now-types").initialJoinNowState;

  beforeEach(async () => {
    vi.clearAllMocks();
    service = (await import("@/lib/services/client-registration-service"))
      .clientRegistrationService;
    ({ registerClientWithAutoCredentials } = await import(
      "@/app/actions/landing"
    ));
    ({ initialJoinNowState } = await import("@/app/actions/join-now-types"));
  });

  it("registers a client with phone only and returns generated credentials", async () => {
    vi.mocked(service.isPhoneAvailable).mockResolvedValue(true);
    vi.mocked(service.registerClient).mockResolvedValue({
      userId: "user-1",
      clientId: "2605001",
      temporaryPassword: "MFS_2605001",
    });

    const formData = new FormData();
    formData.set("fullName", "John Doe");
    formData.set("phone", "01012345678");

    const result = await registerClientWithAutoCredentials(
      initialJoinNowState,
      formData
    );

    expect(service.registerClient).toHaveBeenCalledWith({
      fullName: "John Doe",
      phone: "+201012345678",
    });
    expect(result.credentials).toEqual({
      clientId: "2605001",
      password: "MFS_2605001",
      fullName: "John Doe",
      phone: "+201012345678",
    });
  });

  it("does not register duplicate phones", async () => {
    vi.mocked(service.isPhoneAvailable).mockResolvedValue(false);

    const formData = new FormData();
    formData.set("fullName", "John Doe");
    formData.set("phone", "01012345678");

    const result = await registerClientWithAutoCredentials(
      initialJoinNowState,
      formData
    );

    expect(service.registerClient).not.toHaveBeenCalled();
    expect(result.status).toBe("error");
  });
});
