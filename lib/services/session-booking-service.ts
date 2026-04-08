import "server-only";

import {
  BookingStatus,
  TrainingSessionStatus,
  TrainingSessionType,
} from "@prisma/client";

import { getPrisma } from "@/lib/prisma";
import type {
  CancelSessionBookingInput,
  CreateSessionBookingInput,
} from "@/lib/validators/session-booking";

async function getSessionOrThrow(trainingSessionId: string) {
  const prisma = getPrisma();
  const session = await prisma.trainingSession.findUnique({
    where: { id: trainingSessionId },
    select: {
      id: true,
      type: true,
      status: true,
      capacity: true,
      bookings: {
        where: {
          status: {
            in: [BookingStatus.BOOKED, BookingStatus.ATTENDED, BookingStatus.WAITLIST],
          },
        },
        select: {
          id: true,
          clientId: true,
          status: true,
        },
      },
    },
  });

  if (!session) {
    throw new Error("Session record not found.");
  }

  return session;
}

async function ensureClientExists(clientId: string) {
  const prisma = getPrisma();
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true },
  });

  if (!client) {
    throw new Error("Client record not found.");
  }
}

export async function createSessionBooking(input: CreateSessionBookingInput) {
  const prisma = getPrisma();
  const session = await getSessionOrThrow(input.trainingSessionId);

  if (
    session.status === TrainingSessionStatus.CANCELED ||
    session.status === TrainingSessionStatus.COMPLETED
  ) {
    throw new Error("Bookings can only be changed for active sessions.");
  }

  await ensureClientExists(input.clientId);

  const existingBooking = await prisma.sessionBooking.findUnique({
    where: {
      trainingSessionId_clientId: {
        trainingSessionId: input.trainingSessionId,
        clientId: input.clientId,
      },
    },
    select: {
      id: true,
      status: true,
    },
  });

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
      await prisma.sessionBooking.update({
        where: {
          id: activePrivateBooking.id,
        },
        data: {
          status: BookingStatus.CANCELED,
          canceledAt: new Date(),
        },
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
    return prisma.sessionBooking.update({
      where: {
        id: existingBooking.id,
      },
      data: {
        status: BookingStatus.BOOKED,
        bookedAt: new Date(),
        attendedAt: null,
        canceledAt: null,
      },
      select: {
        id: true,
      },
    });
  }

  return prisma.sessionBooking.create({
    data: {
      trainingSessionId: input.trainingSessionId,
      clientId: input.clientId,
      status: BookingStatus.BOOKED,
    },
    select: {
      id: true,
    },
  });
}

export async function cancelSessionBooking(input: CancelSessionBookingInput) {
  const prisma = getPrisma();

  const booking = await prisma.sessionBooking.findUnique({
    where: {
      trainingSessionId_clientId: {
        trainingSessionId: input.trainingSessionId,
        clientId: input.clientId,
      },
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!booking) {
    throw new Error("Booking record not found.");
  }

  if (booking.status === BookingStatus.CANCELED) {
    return booking;
  }

  return prisma.sessionBooking.update({
    where: { id: booking.id },
    data: {
      status: BookingStatus.CANCELED,
      canceledAt: new Date(),
    },
    select: {
      id: true,
    },
  });
}
