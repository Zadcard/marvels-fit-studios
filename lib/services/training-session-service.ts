import "server-only";

import {
  BookingStatus,
  TrainingSessionStatus,
  TrainingSessionType,
} from "@prisma/client";

import { getPrisma } from "@/lib/prisma";
import type {
  CancelTrainingSessionInput,
  CreateTrainingSessionInput,
  DeleteTrainingSessionInput,
  UpdateTrainingSessionInput,
} from "@/lib/validators/training-session";

function normalizeOptionalString(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function normalizeCapacity(type: TrainingSessionType, capacity: number | null) {
  if (type === TrainingSessionType.PRIVATE) {
    return 1;
  }

  return capacity;
}

async function ensureCoachExists(coachId: string) {
  const prisma = getPrisma();
  const coach = await prisma.coach.findUnique({
    where: { id: coachId },
    select: { id: true },
  });

  if (!coach) {
    throw new Error("Coach record not found.");
  }
}

export async function createTrainingSession(
  input: CreateTrainingSessionInput,
  createdById: string
) {
  const prisma = getPrisma();

  await ensureCoachExists(input.coachId);

  return prisma.trainingSession.create({
    data: {
      title: input.title.trim(),
      description: normalizeOptionalString(input.description),
      type: input.type,
      status: input.status,
      coachId: input.coachId,
      location: normalizeOptionalString(input.location),
      startsAt: new Date(input.startsAt),
      endsAt: new Date(input.endsAt),
      capacity: normalizeCapacity(input.type, input.capacity),
      createdById,
    },
    select: {
      id: true,
    },
  });
}

export async function updateTrainingSession(input: UpdateTrainingSessionInput) {
  const prisma = getPrisma();

  await ensureCoachExists(input.coachId);

  const existingSession = await prisma.trainingSession.findUnique({
    where: { id: input.sessionId },
    select: {
      id: true,
      status: true,
      bookings: {
        where: {
          status: {
            in: [BookingStatus.BOOKED, BookingStatus.ATTENDED, BookingStatus.WAITLIST],
          },
        },
        orderBy: [{ bookedAt: "asc" }],
        select: {
          id: true,
        },
      },
    },
  });

  if (!existingSession) {
    throw new Error("Session record not found.");
  }

  if (existingSession.status === TrainingSessionStatus.CANCELED) {
    throw new Error("Canceled sessions cannot be edited.");
  }

  const normalizedCapacity = normalizeCapacity(input.type, input.capacity);
  const activeBookingCount = existingSession.bookings.length;

  if (
    input.type !== TrainingSessionType.PRIVATE &&
    normalizedCapacity !== null &&
    activeBookingCount > normalizedCapacity
  ) {
    throw new Error("Capacity cannot be lower than the current active roster.");
  }

  return prisma.$transaction(async (tx) => {
    if (input.type === TrainingSessionType.PRIVATE && activeBookingCount > 1) {
      await tx.sessionBooking.updateMany({
        where: {
          id: {
            in: existingSession.bookings.slice(1).map((booking) => booking.id),
          },
        },
        data: {
          status: BookingStatus.CANCELED,
          canceledAt: new Date(),
        },
      });
    }

    return tx.trainingSession.update({
      where: { id: input.sessionId },
      data: {
        title: input.title.trim(),
        description: normalizeOptionalString(input.description),
        type: input.type,
        status: input.status,
        coachId: input.coachId,
        location: normalizeOptionalString(input.location),
        startsAt: new Date(input.startsAt),
        endsAt: new Date(input.endsAt),
        capacity: normalizedCapacity,
      },
      select: {
        id: true,
      },
    });
  });
}

export async function cancelTrainingSession(input: CancelTrainingSessionInput) {
  const prisma = getPrisma();

  const existingSession = await prisma.trainingSession.findUnique({
    where: { id: input.sessionId },
    select: {
      id: true,
      status: true,
    },
  });

  if (!existingSession) {
    throw new Error("Session record not found.");
  }

  if (existingSession.status === TrainingSessionStatus.COMPLETED) {
    throw new Error("Completed sessions cannot be canceled.");
  }

  if (existingSession.status === TrainingSessionStatus.CANCELED) {
    return existingSession;
  }

  return prisma.$transaction(async (tx) => {
    await tx.sessionBooking.updateMany({
      where: {
        trainingSessionId: input.sessionId,
        status: {
          in: [BookingStatus.BOOKED, BookingStatus.ATTENDED, BookingStatus.WAITLIST],
        },
      },
      data: {
        status: BookingStatus.CANCELED,
        canceledAt: new Date(),
      },
    });

    return tx.trainingSession.update({
      where: { id: input.sessionId },
      data: {
        status: TrainingSessionStatus.CANCELED,
      },
      select: {
        id: true,
      },
    });
  });
}

export async function deleteTrainingSession(input: DeleteTrainingSessionInput) {
  const prisma = getPrisma();

  const existingSession = await prisma.trainingSession.findUnique({
    where: { id: input.sessionId },
    select: {
      id: true,
    },
  });

  if (!existingSession) {
    throw new Error("Session record not found.");
  }

  return prisma.trainingSession.delete({
    where: { id: input.sessionId },
    select: {
      id: true,
    },
  });
}
