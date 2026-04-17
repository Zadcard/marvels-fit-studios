import "server-only";

import {
  BookingSource,
  BookingStatus,
  Prisma,
  ScheduleBlockStatus,
  ScheduleRecurrenceType,
  ScheduleDay,
  TrainingSessionStatus,
  TrainingSessionType,
} from "@prisma/client";

import { getPrisma } from "@/lib/prisma";
import {
  buildWeeklyOccurrences,
  formatRecurrenceSummary,
  rangesOverlap,
} from "@/lib/services/schedule-block-utils";
import type {
  CreateScheduleBlockInput,
  DuplicateScheduleBlockInput,
  ReassignScheduleBlockCoachInput,
  ScheduleBlockLifecycleInput,
  ScheduleBlockRosterMutationInput,
  UpdateScheduleBlockInput,
} from "@/lib/validators/schedule-block";

const ACTIVE_SESSION_STATUSES: TrainingSessionStatus[] = [
  TrainingSessionStatus.DRAFT,
  TrainingSessionStatus.SCHEDULED,
];

function normalizeOptionalString(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function normalizeGroupId(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function normalizeCapacity(type: TrainingSessionType, capacity: number | null) {
  if (type === TrainingSessionType.PRIVATE) {
    return 1;
  }

  return capacity;
}

function toDayDateString(value: Date) {
  return value.toISOString().slice(0, 10);
}

type BlockOccurrenceDefinition = {
  startsAt: Date;
  endsAt: Date;
};

type CoachConflictRecord = {
  sessionId: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  location: string | null;
};

async function ensureCoachExists(
  tx: Prisma.TransactionClient,
  coachId: string
) {
  const coach = await tx.coach.findUnique({
    where: { id: coachId },
    select: { id: true },
  });

  if (!coach) {
    throw new Error("Coach record not found.");
  }
}

async function ensureGroupExists(
  tx: Prisma.TransactionClient,
  groupId: string | null
) {
  if (!groupId) {
    return;
  }

  const group = await tx.group.findUnique({
    where: { id: groupId },
    select: { id: true },
  });

  if (!group) {
    throw new Error("Group record not found.");
  }
}

async function ensureClientsExist(
  tx: Prisma.TransactionClient,
  clientIds: string[]
) {
  if (clientIds.length === 0) {
    return;
  }

  const clients = await tx.client.findMany({
    where: {
      id: {
        in: clientIds,
      },
    },
    select: {
      id: true,
    },
  });

  if (clients.length !== clientIds.length) {
    throw new Error("One or more selected clients were not found.");
  }
}

async function resolveInitialRosterClientIds(
  tx: Prisma.TransactionClient,
  groupId: string | null,
  selectedClientIds: string[]
) {
  const resolved = new Set(selectedClientIds);

  if (groupId) {
    const groupClients = await tx.client.findMany({
      where: {
        groupId,
      },
      select: {
        id: true,
      },
    });

    for (const client of groupClients) {
      resolved.add(client.id);
    }
  }

  return [...resolved];
}

function buildOccurrences(input: {
  startsOn: string;
  endsOn: string;
  recurrenceType: ScheduleRecurrenceType;
  recurrenceDays: ScheduleDay[];
  startTime: string;
  endTime: string;
}) {
  if (input.recurrenceType !== ScheduleRecurrenceType.WEEKLY) {
    throw new Error("Only weekly recurrence is supported right now.");
  }

  const occurrences = buildWeeklyOccurrences({
    startsOn: new Date(`${input.startsOn}T00:00:00`),
    endsOn: new Date(`${input.endsOn}T00:00:00`),
    recurrenceDays: input.recurrenceDays,
    startTime: input.startTime,
    endTime: input.endTime,
  });

  if (occurrences.length === 0) {
    throw new Error(
      `No dates matched the selected recurrence pattern (${formatRecurrenceSummary(
        input.recurrenceDays
      )}).`
    );
  }

  return occurrences;
}

async function detectCoachConflicts(
  tx: Prisma.TransactionClient,
  input: {
    coachId: string;
    occurrences: BlockOccurrenceDefinition[];
    excludeScheduleBlockId?: string;
  }
) {
  if (input.occurrences.length === 0) {
    return [] as CoachConflictRecord[];
  }

  const firstStart = input.occurrences[0]?.startsAt;
  const lastEnd = input.occurrences[input.occurrences.length - 1]?.endsAt;

  if (!firstStart || !lastEnd) {
    return [] as CoachConflictRecord[];
  }

  const sessions = await tx.trainingSession.findMany({
    where: {
      coachId: input.coachId,
      status: {
        in: ACTIVE_SESSION_STATUSES,
      },
      startsAt: {
        lte: lastEnd,
      },
      endsAt: {
        gte: firstStart,
      },
      ...(input.excludeScheduleBlockId
        ? {
            OR: [
              { scheduleBlockId: null },
              { scheduleBlockId: { not: input.excludeScheduleBlockId } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      title: true,
      startsAt: true,
      endsAt: true,
      location: true,
    },
  });

  return sessions.filter((session) =>
    input.occurrences.some((occurrence) =>
      rangesOverlap(
        occurrence.startsAt,
        occurrence.endsAt,
        session.startsAt,
        session.endsAt
      )
    )
  );
}

function assertRosterFitsCapacity(input: {
  sessionType: TrainingSessionType;
  capacity: number | null;
  rosterClientIds: string[];
}) {
  const normalizedCapacity = normalizeCapacity(input.sessionType, input.capacity);

  if (
    input.sessionType !== TrainingSessionType.PRIVATE &&
    normalizedCapacity !== null &&
    input.rosterClientIds.length > normalizedCapacity
  ) {
    throw new Error("Roster size cannot exceed the block capacity.");
  }
}

async function ensureBlockRosterRows(
  tx: Prisma.TransactionClient,
  blockId: string,
  clientIds: string[]
) {
  await tx.scheduleBlockClient.deleteMany({
    where: {
      scheduleBlockId: blockId,
      clientId: {
        notIn: clientIds,
      },
    },
  });

  for (const clientId of clientIds) {
    await tx.scheduleBlockClient.upsert({
      where: {
        scheduleBlockId_clientId: {
          scheduleBlockId: blockId,
          clientId,
        },
      },
      update: {},
      create: {
        scheduleBlockId: blockId,
        clientId,
      },
    });
  }
}

async function syncBlockBookingsForSession(
  tx: Prisma.TransactionClient,
  input: {
    sessionId: string;
    clientIds: string[];
    sessionType: TrainingSessionType;
    capacity: number | null;
  }
) {
  const desiredClientIds =
    input.sessionType === TrainingSessionType.PRIVATE
      ? input.clientIds.slice(0, 1)
      : input.clientIds.slice(
          0,
          input.capacity === null ? input.clientIds.length : input.capacity
        );

  const existingBookings = await tx.sessionBooking.findMany({
    where: {
      trainingSessionId: input.sessionId,
    },
    select: {
      id: true,
      clientId: true,
      status: true,
      source: true,
    },
  });

  for (const booking of existingBookings) {
    if (
      booking.source === BookingSource.BLOCK &&
      booking.status !== BookingStatus.CANCELED &&
      !desiredClientIds.includes(booking.clientId)
    ) {
      await tx.sessionBooking.update({
        where: { id: booking.id },
        data: {
          status: BookingStatus.CANCELED,
          canceledAt: new Date(),
          attendedAt: null,
        },
      });
    }
  }

  for (const clientId of desiredClientIds) {
    const existingBooking = existingBookings.find(
      (booking) => booking.clientId === clientId
    );

    if (existingBooking) {
      if (existingBooking.status === BookingStatus.CANCELED) {
        await tx.sessionBooking.update({
          where: { id: existingBooking.id },
          data: {
            status: BookingStatus.BOOKED,
            source: BookingSource.BLOCK,
            bookedAt: new Date(),
            canceledAt: null,
            attendedAt: null,
          },
        });
      } else if (existingBooking.source !== BookingSource.BLOCK) {
        await tx.sessionBooking.update({
          where: { id: existingBooking.id },
          data: {
            source: existingBooking.source,
          },
        });
      }

      continue;
    }

    await tx.sessionBooking.create({
      data: {
        trainingSessionId: input.sessionId,
        clientId,
        status: BookingStatus.BOOKED,
        source: BookingSource.BLOCK,
      },
      select: {
        id: true,
      },
    });
  }
}

async function upsertFutureSessionsForBlock(
  tx: Prisma.TransactionClient,
  input: {
    blockId: string;
    title: string;
    description: string | null;
    sessionType: TrainingSessionType;
    status: ScheduleBlockStatus;
    coachId: string;
    groupId: string | null;
    location: string | null;
    capacity: number | null;
    createdById: string;
    rosterClientIds: string[];
    occurrences: BlockOccurrenceDefinition[];
    cutoffDate: Date;
  }
) {
  const desiredOccurrenceMap = new Map(
    input.occurrences
      .filter((occurrence) => occurrence.startsAt >= input.cutoffDate)
      .map((occurrence) => [occurrence.startsAt.toISOString(), occurrence] as const)
  );

  const futureSessions = await tx.trainingSession.findMany({
    where: {
      scheduleBlockId: input.blockId,
      startsAt: {
        gte: input.cutoffDate,
      },
    },
    select: {
      id: true,
      startsAt: true,
      status: true,
      bookings: {
        where: {
          status: {
            in: [BookingStatus.BOOKED, BookingStatus.ATTENDED, BookingStatus.WAITLIST],
          },
        },
        select: {
          id: true,
        },
      },
    },
  });

  for (const session of futureSessions) {
    const occurrence = desiredOccurrenceMap.get(session.startsAt.toISOString());

    if (session.status === TrainingSessionStatus.COMPLETED) {
      if (occurrence) {
        desiredOccurrenceMap.delete(session.startsAt.toISOString());
      }

      continue;
    }

    if (!occurrence) {
      await tx.trainingSession.update({
        where: { id: session.id },
        data: {
          status: TrainingSessionStatus.CANCELED,
        },
      });

      continue;
    }

    await tx.trainingSession.update({
      where: { id: session.id },
      data: {
        title: input.title,
        description: input.description,
        type: input.sessionType,
        status:
          input.status === ScheduleBlockStatus.ACTIVE
            ? TrainingSessionStatus.SCHEDULED
            : TrainingSessionStatus.DRAFT,
        coachId: input.coachId,
        groupId: input.groupId,
        location: input.location,
        startsAt: occurrence.startsAt,
        endsAt: occurrence.endsAt,
        capacity: normalizeCapacity(input.sessionType, input.capacity),
      },
    });

    await syncBlockBookingsForSession(tx, {
      sessionId: session.id,
      clientIds: input.rosterClientIds,
      sessionType: input.sessionType,
      capacity: normalizeCapacity(input.sessionType, input.capacity),
    });

    desiredOccurrenceMap.delete(session.startsAt.toISOString());
  }

  for (const occurrence of desiredOccurrenceMap.values()) {
    const createdSession = await tx.trainingSession.create({
      data: {
        title: input.title,
        description: input.description,
        type: input.sessionType,
        status:
          input.status === ScheduleBlockStatus.ACTIVE
            ? TrainingSessionStatus.SCHEDULED
            : TrainingSessionStatus.DRAFT,
        startsAt: occurrence.startsAt,
        endsAt: occurrence.endsAt,
        capacity: normalizeCapacity(input.sessionType, input.capacity),
        location: input.location,
        coachId: input.coachId,
        groupId: input.groupId,
        scheduleBlockId: input.blockId,
        createdById: input.createdById,
      },
      select: {
        id: true,
      },
    });

    await syncBlockBookingsForSession(tx, {
      sessionId: createdSession.id,
      clientIds: input.rosterClientIds,
      sessionType: input.sessionType,
      capacity: normalizeCapacity(input.sessionType, input.capacity),
    });
  }
}

function mapInputDays(days: string[]) {
  return days.map((day) => day as ScheduleDay);
}

async function getScheduleBlockOrThrow(
  tx: Prisma.TransactionClient,
  blockId: string
) {
  const block = await tx.scheduleBlock.findUnique({
    where: { id: blockId },
    select: {
      id: true,
      title: true,
      description: true,
      sessionType: true,
      status: true,
      recurrenceType: true,
      recurrenceDays: true,
      startsOn: true,
      endsOn: true,
      startTime: true,
      endTime: true,
      timezone: true,
      coachId: true,
      groupId: true,
      location: true,
      capacity: true,
      createdById: true,
      roster: {
        select: {
          clientId: true,
        },
      },
    },
  });

  if (!block) {
    throw new Error("Schedule block not found.");
  }

  return block;
}

export async function createScheduleBlock(
  input: CreateScheduleBlockInput,
  createdById: string
) {
  const prisma = getPrisma();

  return prisma.$transaction(async (tx) => {
    await ensureCoachExists(tx, input.coachId);

    const groupId = normalizeGroupId(input.groupId);
    await ensureGroupExists(tx, groupId);

    const rosterClientIds = await resolveInitialRosterClientIds(
      tx,
      groupId,
      input.clientIds
    );

    await ensureClientsExist(tx, rosterClientIds);
    assertRosterFitsCapacity({
      sessionType: input.sessionType,
      capacity: input.capacity,
      rosterClientIds,
    });

    const recurrenceDays = mapInputDays(input.recurrenceDays);
    const occurrences = buildOccurrences({
      startsOn: input.startsOn,
      endsOn: input.endsOn,
      recurrenceType: input.recurrenceType,
      recurrenceDays,
      startTime: input.startTime,
      endTime: input.endTime,
    });

    const conflicts = await detectCoachConflicts(tx, {
      coachId: input.coachId,
      occurrences,
    });

    if (conflicts.length > 0) {
      throw new Error(
        `Coach already has ${conflicts.length} overlapping session${
          conflicts.length === 1 ? "" : "s"
        } in this date range.`
      );
    }

    const block = await tx.scheduleBlock.create({
      data: {
        title: input.title.trim(),
        description: normalizeOptionalString(input.description),
        sessionType: input.sessionType,
        status: input.status,
        recurrenceType: input.recurrenceType,
        recurrenceDays,
        startsOn: new Date(`${input.startsOn}T00:00:00`),
        endsOn: new Date(`${input.endsOn}T00:00:00`),
        startTime: input.startTime,
        endTime: input.endTime,
        timezone: input.timezone,
        capacity: normalizeCapacity(input.sessionType, input.capacity),
        location: normalizeOptionalString(input.location),
        coachId: input.coachId,
        groupId,
        createdById,
      },
      select: {
        id: true,
      },
    });

    await ensureBlockRosterRows(tx, block.id, rosterClientIds);

    await upsertFutureSessionsForBlock(tx, {
      blockId: block.id,
      title: input.title.trim(),
      description: normalizeOptionalString(input.description),
      sessionType: input.sessionType,
      status: input.status,
      coachId: input.coachId,
      groupId,
      location: normalizeOptionalString(input.location),
      capacity: normalizeCapacity(input.sessionType, input.capacity),
      createdById,
      rosterClientIds,
      occurrences,
      cutoffDate: new Date("1970-01-01T00:00:00.000Z"),
    });

    return block;
  });
}

export async function updateScheduleBlock(input: UpdateScheduleBlockInput) {
  const prisma = getPrisma();

  return prisma.$transaction(async (tx) => {
    const existingBlock = await getScheduleBlockOrThrow(tx, input.blockId);
    const groupId = normalizeGroupId(input.groupId);

    await ensureCoachExists(tx, input.coachId);
    await ensureGroupExists(tx, groupId);

    const rosterClientIds = await resolveInitialRosterClientIds(
      tx,
      groupId,
      input.clientIds
    );

    await ensureClientsExist(tx, rosterClientIds);
    assertRosterFitsCapacity({
      sessionType: input.sessionType,
      capacity: input.capacity,
      rosterClientIds,
    });

    const recurrenceDays = mapInputDays(input.recurrenceDays);
    const occurrences = buildOccurrences({
      startsOn: input.startsOn,
      endsOn: input.endsOn,
      recurrenceType: input.recurrenceType,
      recurrenceDays,
      startTime: input.startTime,
      endTime: input.endTime,
    });

    const conflicts = await detectCoachConflicts(tx, {
      coachId: input.coachId,
      occurrences,
      excludeScheduleBlockId: existingBlock.id,
    });

    if (conflicts.length > 0) {
      throw new Error(
        `Coach already has ${conflicts.length} overlapping future session${
          conflicts.length === 1 ? "" : "s"
        } in this recurrence window.`
      );
    }

    await tx.scheduleBlock.update({
      where: { id: existingBlock.id },
      data: {
        title: input.title.trim(),
        description: normalizeOptionalString(input.description),
        sessionType: input.sessionType,
        status: input.status,
        recurrenceType: input.recurrenceType,
        recurrenceDays,
        startsOn: new Date(`${input.startsOn}T00:00:00`),
        endsOn: new Date(`${input.endsOn}T00:00:00`),
        startTime: input.startTime,
        endTime: input.endTime,
        timezone: input.timezone,
        coachId: input.coachId,
        groupId,
        location: normalizeOptionalString(input.location),
        capacity: normalizeCapacity(input.sessionType, input.capacity),
      },
    });

    await ensureBlockRosterRows(tx, existingBlock.id, rosterClientIds);

    await upsertFutureSessionsForBlock(tx, {
      blockId: existingBlock.id,
      title: input.title.trim(),
      description: normalizeOptionalString(input.description),
      sessionType: input.sessionType,
      status: input.status,
      coachId: input.coachId,
      groupId,
      location: normalizeOptionalString(input.location),
      capacity: normalizeCapacity(input.sessionType, input.capacity),
      createdById: existingBlock.createdById,
      rosterClientIds,
      occurrences,
      cutoffDate:
        input.scope === "THIS_AND_FUTURE" ? new Date() : new Date("1970-01-01T00:00:00.000Z"),
    });

    return { id: existingBlock.id };
  });
}

export async function addClientToScheduleBlock(
  input: ScheduleBlockRosterMutationInput
) {
  const prisma = getPrisma();

  return prisma.$transaction(async (tx) => {
    const block = await getScheduleBlockOrThrow(tx, input.blockId);
    await ensureClientsExist(tx, [input.clientId]);

    const nextRosterClientIds = [
      ...new Set([...block.roster.map((entry) => entry.clientId), input.clientId]),
    ];

    assertRosterFitsCapacity({
      sessionType: block.sessionType,
      capacity: block.capacity,
      rosterClientIds: nextRosterClientIds,
    });

    await ensureBlockRosterRows(tx, block.id, nextRosterClientIds);

    const occurrences = buildOccurrences({
      startsOn: toDayDateString(block.startsOn),
      endsOn: toDayDateString(block.endsOn),
      recurrenceType: block.recurrenceType,
      recurrenceDays: block.recurrenceDays,
      startTime: block.startTime,
      endTime: block.endTime,
    });

    await upsertFutureSessionsForBlock(tx, {
      blockId: block.id,
      title: block.title,
      description: block.description,
      sessionType: block.sessionType,
      status: block.status,
      coachId: block.coachId,
      groupId: block.groupId,
      location: block.location,
      capacity: block.capacity,
      createdById: block.createdById,
      rosterClientIds: nextRosterClientIds,
      occurrences,
      cutoffDate: new Date(),
    });

    return { id: block.id };
  });
}

export async function removeClientFromScheduleBlock(
  input: ScheduleBlockRosterMutationInput
) {
  const prisma = getPrisma();

  return prisma.$transaction(async (tx) => {
    const block = await getScheduleBlockOrThrow(tx, input.blockId);
    const nextRosterClientIds = block.roster
      .map((entry) => entry.clientId)
      .filter((clientId) => clientId !== input.clientId);

    await ensureBlockRosterRows(tx, block.id, nextRosterClientIds);

    const occurrences = buildOccurrences({
      startsOn: toDayDateString(block.startsOn),
      endsOn: toDayDateString(block.endsOn),
      recurrenceType: block.recurrenceType,
      recurrenceDays: block.recurrenceDays,
      startTime: block.startTime,
      endTime: block.endTime,
    });

    await upsertFutureSessionsForBlock(tx, {
      blockId: block.id,
      title: block.title,
      description: block.description,
      sessionType: block.sessionType,
      status: block.status,
      coachId: block.coachId,
      groupId: block.groupId,
      location: block.location,
      capacity: block.capacity,
      createdById: block.createdById,
      rosterClientIds: nextRosterClientIds,
      occurrences,
      cutoffDate: new Date(),
    });

    return { id: block.id };
  });
}

export async function moveClientBetweenScheduleBlocks(input: {
  fromBlockId: string;
  toBlockId: string;
  clientId: string;
}) {
  await removeClientFromScheduleBlock({
    blockId: input.fromBlockId,
    clientId: input.clientId,
  });

  return addClientToScheduleBlock({
    blockId: input.toBlockId,
    clientId: input.clientId,
  });
}

export async function reassignScheduleBlockCoach(
  input: ReassignScheduleBlockCoachInput
) {
  const prisma = getPrisma();

  return prisma.$transaction(async (tx) => {
    const block = await getScheduleBlockOrThrow(tx, input.blockId);
    await ensureCoachExists(tx, input.coachId);

    const occurrences = buildOccurrences({
      startsOn: toDayDateString(block.startsOn),
      endsOn: toDayDateString(block.endsOn),
      recurrenceType: block.recurrenceType,
      recurrenceDays: block.recurrenceDays,
      startTime: block.startTime,
      endTime: block.endTime,
    });

    const conflicts = await detectCoachConflicts(tx, {
      coachId: input.coachId,
      occurrences,
      excludeScheduleBlockId: block.id,
    });

    if (conflicts.length > 0) {
      throw new Error("Selected coach has conflicting future sessions.");
    }

    await tx.scheduleBlock.update({
      where: { id: block.id },
      data: {
        coachId: input.coachId,
      },
    });

    await tx.trainingSession.updateMany({
      where: {
        scheduleBlockId: block.id,
        startsAt: {
          gte: new Date(),
        },
        status: {
          in: ACTIVE_SESSION_STATUSES,
        },
      },
      data: {
        coachId: input.coachId,
      },
    });

    return { id: block.id };
  });
}

export async function updateScheduleBlockLifecycle(
  input: ScheduleBlockLifecycleInput
) {
  const prisma = getPrisma();

  return prisma.$transaction(async (tx) => {
    const block = await getScheduleBlockOrThrow(tx, input.blockId);

    await tx.scheduleBlock.update({
      where: { id: block.id },
      data: {
        status: input.nextStatus,
      },
    });

    if (input.nextStatus === ScheduleBlockStatus.ARCHIVED) {
      await tx.trainingSession.updateMany({
        where: {
          scheduleBlockId: block.id,
          startsAt: {
            gte: new Date(),
          },
          status: {
            in: ACTIVE_SESSION_STATUSES,
          },
        },
        data: {
          status: TrainingSessionStatus.CANCELED,
        },
      });
    }

    if (input.nextStatus === ScheduleBlockStatus.PAUSED) {
      await tx.trainingSession.updateMany({
        where: {
          scheduleBlockId: block.id,
          startsAt: {
            gte: new Date(),
          },
          status: {
            in: ACTIVE_SESSION_STATUSES,
          },
        },
        data: {
          status: TrainingSessionStatus.DRAFT,
        },
      });
    }

    if (input.nextStatus === ScheduleBlockStatus.ACTIVE) {
      await tx.trainingSession.updateMany({
        where: {
          scheduleBlockId: block.id,
          startsAt: {
            gte: new Date(),
          },
          status: TrainingSessionStatus.DRAFT,
        },
        data: {
          status: TrainingSessionStatus.SCHEDULED,
        },
      });
    }

    return { id: block.id };
  });
}

export async function duplicateScheduleBlock(input: DuplicateScheduleBlockInput) {
  const prisma = getPrisma();
  const block = await prisma.scheduleBlock.findUnique({
    where: { id: input.blockId },
    select: {
      title: true,
      description: true,
      sessionType: true,
      status: true,
      recurrenceType: true,
      recurrenceDays: true,
      startTime: true,
      endTime: true,
      timezone: true,
      coachId: true,
      groupId: true,
      location: true,
      capacity: true,
      createdById: true,
      roster: {
        select: {
          clientId: true,
        },
      },
    },
  });

  if (!block) {
    throw new Error("Schedule block not found.");
  }

  return createScheduleBlock(
    {
      title: `${block.title} Copy`,
      description: block.description ?? "",
      sessionType: block.sessionType,
      status: block.status,
      recurrenceType: block.recurrenceType,
      recurrenceDays: block.recurrenceDays,
      startsOn: input.startsOn,
      endsOn: input.endsOn,
      startTime: block.startTime,
      endTime: block.endTime,
      timezone: block.timezone,
      coachId: block.coachId,
      groupId: block.groupId ?? "",
      clientIds: block.roster.map((entry) => entry.clientId),
      location: block.location ?? "",
      capacity: block.capacity,
    },
    block.createdById
  );
}

export async function getCoachPlanningSummary(coachId: string) {
  const prisma = getPrisma();
  const now = new Date();
  const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [sessionsThisWeek, recurringBlocks] = await Promise.all([
    prisma.trainingSession.count({
      where: {
        coachId,
        status: {
          in: ACTIVE_SESSION_STATUSES,
        },
        startsAt: {
          gte: now,
          lte: weekEnd,
        },
      },
    }),
    prisma.scheduleBlock.count({
      where: {
        coachId,
        status: {
          in: [ScheduleBlockStatus.ACTIVE, ScheduleBlockStatus.PAUSED],
        },
      },
    }),
  ]);

  return {
    sessionsThisWeek,
    recurringBlocks,
  };
}
