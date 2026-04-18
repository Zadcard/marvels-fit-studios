"use server";

import { ScheduleBlockStatus, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import {
  addClientToScheduleBlock,
  createScheduleBlock,
  duplicateScheduleBlock,
  moveClientBetweenScheduleBlocks,
  reassignScheduleBlockCoach,
  removeClientFromScheduleBlock,
  updateScheduleBlock,
  updateScheduleBlockLifecycle,
} from "@/lib/services/schedule-block-service";
import {
  createScheduleBlockSchema,
  duplicateScheduleBlockSchema,
  reassignScheduleBlockCoachSchema,
  scheduleBlockLifecycleSchema,
  scheduleBlockRosterMutationSchema,
  updateScheduleBlockSchema,
} from "@/lib/validators/schedule-block";

type SaveScheduleBlockInput = {
  blockId?: string | null;
  title: string;
  description?: string;
  sessionType: "GROUP" | "PRIVATE";
  status: "ACTIVE" | "PAUSED" | "ARCHIVED";
  recurrenceType: "WEEKLY";
  recurrenceDays: string[];
  startsOn: string;
  endsOn: string;
  startTime: string;
  endTime: string;
  timezone: string;
  coachId: string;
  groupId?: string;
  clientIds: string[];
  location?: string;
  capacity: number | null;
  scope?: "THIS_AND_FUTURE" | "ENTIRE_SERIES";
};

function revalidateScheduleBlockViews() {
  revalidatePath("/admin");
  revalidatePath("/admin/schedule");
  revalidatePath("/admin/sessions");
  revalidatePath("/admin/blocks");
  revalidatePath("/admin/clients");
  revalidatePath("/admin/coaches");
  revalidatePath("/coach");
  revalidatePath("/coach/schedule");
  revalidatePath("/coach/sessions");
  revalidatePath("/coach/clients");
  revalidatePath("/client");
  revalidatePath("/client/sessions");
}

export async function saveAdminScheduleBlock(input: SaveScheduleBlockInput) {
  const user = await requireRole(UserRole.ADMIN);

  if (input.blockId) {
    const parsed = updateScheduleBlockSchema.safeParse({
      ...input,
      blockId: input.blockId,
      scope: input.scope ?? "THIS_AND_FUTURE",
    });

    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message ?? "Invalid block details.");
    }

    await updateScheduleBlock(parsed.data);
  } else {
    const parsed = createScheduleBlockSchema.safeParse(input);

    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message ?? "Invalid block details.");
    }

    await createScheduleBlock(parsed.data, user.id);
  }

  revalidateScheduleBlockViews();
}

export async function updateAdminScheduleBlockStatus(
  blockId: string,
  nextStatus: "ACTIVE" | "PAUSED" | "ARCHIVED"
) {
  await requireRole(UserRole.ADMIN);

  const parsed = scheduleBlockLifecycleSchema.safeParse({
    blockId,
    nextStatus,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid block status change.");
  }

  await updateScheduleBlockLifecycle(parsed.data);
  revalidateScheduleBlockViews();
}

export async function duplicateAdminScheduleBlock(
  blockId: string,
  startsOn: string,
  endsOn: string
) {
  await requireRole(UserRole.ADMIN);

  const parsed = duplicateScheduleBlockSchema.safeParse({
    blockId,
    startsOn,
    endsOn,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid duplicate window.");
  }

  await duplicateScheduleBlock(parsed.data);
  revalidateScheduleBlockViews();
}

export async function addClientToAdminScheduleBlock(
  blockId: string,
  clientId: string
) {
  await requireRole(UserRole.ADMIN);

  const parsed = scheduleBlockRosterMutationSchema.safeParse({
    blockId,
    clientId,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid roster change.");
  }

  await addClientToScheduleBlock(parsed.data);
  revalidateScheduleBlockViews();
}

export async function removeClientFromAdminScheduleBlock(
  blockId: string,
  clientId: string
) {
  await requireRole(UserRole.ADMIN);

  const parsed = scheduleBlockRosterMutationSchema.safeParse({
    blockId,
    clientId,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid roster change.");
  }

  await removeClientFromScheduleBlock(parsed.data);
  revalidateScheduleBlockViews();
}

export async function moveClientBetweenAdminScheduleBlocks(
  fromBlockId: string,
  toBlockId: string,
  clientId: string
) {
  await requireRole(UserRole.ADMIN);

  await moveClientBetweenScheduleBlocks({
    fromBlockId,
    toBlockId,
    clientId,
  });
  revalidateScheduleBlockViews();
}

export async function reassignAdminScheduleBlockCoach(
  blockId: string,
  coachId: string
) {
  await requireRole(UserRole.ADMIN);

  const parsed = reassignScheduleBlockCoachSchema.safeParse({
    blockId,
    coachId,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid coach assignment.");
  }

  await reassignScheduleBlockCoach(parsed.data);
  revalidateScheduleBlockViews();
}
