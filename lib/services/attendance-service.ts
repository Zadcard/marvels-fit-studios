import "server-only";

import {
  BookingStatus,
  TrainingSessionStatus,
  TrainingSessionType,
} from "@/lib/supabase/domain";

import {
  runAttendanceTransaction,
  runBulkAttendanceTransaction,
} from "@/lib/services/attendance-store";
import type {
  BulkUpdateSessionAttendanceInput,
  UpdateSessionAttendanceInput,
} from "@/lib/validators/session-booking";

function getSubscriptionWindowEnd(subscription: {
  renewsAt: Date | null;
  endsAt: Date | null;
}) {
  return subscription.renewsAt ?? subscription.endsAt;
}

function isSessionWithinSubscriptionWindow(
  sessionStartsAt: Date,
  subscription: {
    startsAt: Date;
    renewsAt: Date | null;
    endsAt: Date | null;
  }
) {
  const windowEnd = getSubscriptionWindowEnd(subscription);

  return (
    sessionStartsAt.getTime() >= subscription.startsAt.getTime() &&
    (!windowEnd || sessionStartsAt.getTime() <= windowEnd.getTime())
  );
}

export async function updateSessionAttendance(input: UpdateSessionAttendanceInput) {
  return runAttendanceTransaction(input, async (tx) => {
    const booking = await tx.sessionBooking.findUnique({
      where: {
        trainingSessionId_clientId: {
          trainingSessionId: input.trainingSessionId,
          clientId: input.clientId,
        },
      },
      select: {
        id: true,
        clientId: true,
        status: true,
        trainingSession: {
          select: {
            startsAt: true,
            status: true,
            type: true,
          },
        },
      },
    });

    if (!booking) {
      throw new Error("Booking record not found.");
    }

    if (booking.trainingSession.status === TrainingSessionStatus.CANCELED) {
      throw new Error("Attendance cannot be updated for canceled sessions.");
    }

    if (booking.status === BookingStatus.CANCELED) {
      throw new Error("Attendance cannot be updated for canceled bookings.");
    }

    if (
      input.status === BookingStatus.WAITLIST &&
      booking.trainingSession.type === TrainingSessionType.PRIVATE
    ) {
      throw new Error("Private sessions cannot place a client on the waitlist.");
    }

    const updatedBooking = await tx.sessionBooking.update({
      where: {
        id: booking.id,
      },
      data: {
        status: input.status,
        attendedAt:
          input.status === BookingStatus.ATTENDED || input.status === BookingStatus.LATE
            ? new Date()
            : null,
        canceledAt: input.status === BookingStatus.CANCELED ? new Date() : null,
      },
      select: {
        id: true,
      },
    });

    const relatedSubscriptions = await tx.clientSubscription.findMany({
      where: {
        clientId: booking.clientId,
      },
      select: {
        id: true,
        startsAt: true,
        endsAt: true,
        renewsAt: true,
      },
    });

    const subscriptionsToSync = relatedSubscriptions.filter((subscription) =>
      isSessionWithinSubscriptionWindow(
        booking.trainingSession.startsAt,
        subscription
      )
    );

    for (const subscription of subscriptionsToSync) {
      const windowEnd = getSubscriptionWindowEnd(subscription);
      const sessionsUsed = await tx.sessionBooking.count({
        where: {
          clientId: booking.clientId,
          status: { in: [BookingStatus.ATTENDED, BookingStatus.LATE] },
          trainingSession: {
            status: {
              not: TrainingSessionStatus.CANCELED,
            },
            startsAt: {
              gte: subscription.startsAt,
              ...(windowEnd ? { lte: windowEnd } : {}),
            },
          },
        },
      });

      await tx.clientSubscription.update({
        where: {
          id: subscription.id,
        },
        data: {
          sessionsUsed,
        },
      });
    }

    return updatedBooking;
  });
}

export async function bulkUpdateSessionAttendance(
  input: BulkUpdateSessionAttendanceInput,
) {
  return runBulkAttendanceTransaction(input);
}
