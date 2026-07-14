import "server-only";

import {
  BookingSource,
  BookingStatus,
  TrainingSessionStatus,
  TrainingSessionType,
} from "@/lib/supabase/domain";

import { getSessionBookingStore } from "@/lib/services/session-booking-store";
import type {
  CancelSessionBookingInput,
  CreateSessionBookingInput,
} from "@/lib/validators/session-booking";

async function getSessionOrThrow(trainingSessionId: string) {
  const session = await getSessionBookingStore().findSession(trainingSessionId);

  if (!session) {
    throw new Error("Session record not found.");
  }

  return session;
}

async function ensureClientExists(clientId: string) {
  const client = await getSessionBookingStore().findClient(clientId);

  if (!client) {
    throw new Error("Client record not found.");
  }
}

export async function createSessionBooking(input: CreateSessionBookingInput) {
  const store = getSessionBookingStore();
  const session = await getSessionOrThrow(input.trainingSessionId);

  if (
    session.status === TrainingSessionStatus.CANCELED ||
    session.status === TrainingSessionStatus.COMPLETED
  ) {
    throw new Error("Bookings can only be changed for active sessions.");
  }

  await ensureClientExists(input.clientId);

  const existingBooking = await store.findBooking(input.trainingSessionId, input.clientId);

  if (
    existingBooking &&
    (existingBooking.status === BookingStatus.BOOKED ||
      existingBooking.status === BookingStatus.ATTENDED ||
      existingBooking.status === BookingStatus.WAITLIST)
  ) {
    throw new Error("This client is already assigned to the session.");
  }

  if (session.type === TrainingSessionType.PRIVATE && session.bookings.length >= 1) {
    const activePrivateBooking = session.bookings[0];

    if (activePrivateBooking && activePrivateBooking.clientId !== input.clientId) {
      await store.updateBooking(activePrivateBooking.id, {
          status: BookingStatus.CANCELED,
          canceledAt: new Date(),
      });
    }
  }

  if (
    session.capacity !== null &&
    session.type !== TrainingSessionType.PRIVATE &&
    session.bookings.length >= session.capacity
  ) {
    throw new Error("This session is already at capacity.");
  }

  if (existingBooking) {
    return store.updateBooking(existingBooking.id, {
        status: BookingStatus.BOOKED,
        source: BookingSource.MANUAL,
        bookedAt: new Date(),
        attendedAt: null,
        canceledAt: null,
    });
  }

  return store.createBooking({
      trainingSessionId: input.trainingSessionId,
      clientId: input.clientId,
      status: BookingStatus.BOOKED,
      source: BookingSource.MANUAL,
  });
}

export async function cancelSessionBooking(input: CancelSessionBookingInput) {
  const store = getSessionBookingStore();

  const booking = await store.findBooking(input.trainingSessionId, input.clientId);

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
