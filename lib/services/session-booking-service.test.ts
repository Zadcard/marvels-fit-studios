import { beforeEach, describe, expect, it, vi } from "vitest";

import { BookingStatus } from "@/lib/supabase/domain";

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  findBooking: vi.fn(),
  updateBooking: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  getSupabaseServerClient: () => ({ rpc: mocks.rpc }),
}));

vi.mock("@/lib/services/session-booking-store", () => ({
  getSessionBookingStore: () => ({
    findBooking: mocks.findBooking,
    updateBooking: mocks.updateBooking,
  }),
}));

import {
  cancelSessionBooking,
  createSessionBooking,
} from "@/lib/services/session-booking-service";

describe("transactional session booking service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("delegates create and private replacement to one database transaction", async () => {
    mocks.rpc.mockResolvedValue({
      data: { id: "booking-1", status: "BOOKED" },
      error: null,
    });

    await expect(
      createSessionBooking({
        trainingSessionId: "session-1",
        clientId: "client-1",
      }),
    ).resolves.toEqual({ id: "booking-1", status: "BOOKED" });
    expect(mocks.rpc).toHaveBeenCalledWith("book_client_into_session", {
      p_session_id: "session-1",
      p_client_id: "client-1",
    });
  });

  it("returns waitlist results from the transaction", async () => {
    mocks.rpc.mockResolvedValue({
      data: { id: "booking-2", status: "WAITLIST" },
      error: null,
    });
    await expect(
      createSessionBooking({
        trainingSessionId: "session-1",
        clientId: "client-2",
      }),
    ).resolves.toMatchObject({ status: "WAITLIST" });
  });

  it("maps database business-rule errors without leaking internals", async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: { message: "P0001: This session is already at capacity. context" },
    });
    await expect(
      createSessionBooking({
        trainingSessionId: "session-1",
        clientId: "client-2",
      }),
    ).rejects.toThrow("This session is already at capacity.");
  });

  it("rejects unknown database errors with a safe message", async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: { message: "internal database detail" },
    });
    await expect(
      createSessionBooking({
        trainingSessionId: "session-1",
        clientId: "client-2",
      }),
    ).rejects.toThrow("Session booking operation failed.");
  });

  it("keeps an already canceled booking idempotent", async () => {
    mocks.findBooking.mockResolvedValue({
      id: "booking-1",
      status: BookingStatus.CANCELED,
    });
    await expect(
      cancelSessionBooking({
        trainingSessionId: "session-1",
        clientId: "client-1",
      }),
    ).resolves.toMatchObject({ status: BookingStatus.CANCELED });
    expect(mocks.updateBooking).not.toHaveBeenCalled();
  });

  it("cancels an active booking", async () => {
    mocks.findBooking.mockResolvedValue({
      id: "booking-1",
      status: BookingStatus.BOOKED,
    });
    mocks.updateBooking.mockResolvedValue({
      id: "booking-1",
      status: BookingStatus.CANCELED,
    });
    await cancelSessionBooking({
      trainingSessionId: "session-1",
      clientId: "client-1",
    });
    expect(mocks.updateBooking).toHaveBeenCalledWith(
      "booking-1",
      expect.objectContaining({
        status: BookingStatus.CANCELED,
        attendedAt: null,
      }),
    );
  });
});
