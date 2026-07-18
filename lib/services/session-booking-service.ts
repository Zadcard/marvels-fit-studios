import "server-only";

import { BookingStatus } from "@/lib/supabase/domain";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSessionBookingStore } from "@/lib/services/session-booking-store";
import type {
  CancelSessionBookingInput,
  CreateSessionBookingInput,
} from "@/lib/validators/session-booking";

const bookingErrors = [
  "Session record not found.",
  "Client record not found.",
  "Bookings can only be changed for active sessions.",
  "This client is already assigned to the session.",
  "This session is already at capacity.",
];

export async function createSessionBooking(input: CreateSessionBookingInput) {
  const { data, error } = await getSupabaseServerClient().rpc(
    "book_client_into_session",
    {
      p_session_id: input.trainingSessionId,
      p_client_id: input.clientId,
    },
  );
  if (error) {
    const message = bookingErrors.find((value) => error.message.includes(value));
    throw new Error(message ?? "Session booking operation failed.");
  }
  return data as { id: string; status: BookingStatus };
}

export async function cancelSessionBooking(input: CancelSessionBookingInput) {
  const store = getSessionBookingStore();
  const booking = await store.findBooking(
    input.trainingSessionId,
    input.clientId,
  );

  if (!booking) {
    throw new Error("Booking record not found.");
  }

  if (booking.status === BookingStatus.CANCELED) {
    return booking;
  }

  return store.updateBooking(booking.id, {
    status: BookingStatus.CANCELED,
    attendedAt: null,
    canceledAt: new Date(),
  });
}
