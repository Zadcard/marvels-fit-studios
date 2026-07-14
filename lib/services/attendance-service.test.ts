// Mock must be first
import { mockGetDataStore, createMockDataStore } from '@/tests/test-utils';
import { vi } from 'vitest';

vi.mock('@/lib/services/attendance-store', () => ({
  runAttendanceTransaction: (_input: unknown, operation: (tx: unknown) => unknown) =>
    mockGetDataStore().$transaction(operation),
}));

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  BookingStatus,
  TrainingSessionStatus,
  TrainingSessionType,
} from '@/lib/supabase/domain';
import { updateSessionAttendance } from './attendance-service';

describe('Attendance Service', () => {
  let mockDataStore: ReturnType<typeof createMockDataStore>;
  let mockTx: ReturnType<typeof createMockDataStore>;

  beforeEach(() => {
    mockDataStore = createMockDataStore();
    mockTx = createMockDataStore();
    mockGetDataStore.mockReturnValue(mockDataStore);

    // Setup $transaction to execute callback immediately with mock tx
    mockDataStore.$transaction = vi.fn(async (callback: any) => {
      return callback(mockTx);
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('updateSessionAttendance', () => {
    const validInput = {
      trainingSessionId: 'session-123',
      clientId: 'client-456',
      status: BookingStatus.ATTENDED,
    };

    describe('Validation', () => {
      it('should throw error when booking does not exist', async () => {
        mockTx.sessionBooking.findUnique.mockResolvedValue(null);

        await expect(
          updateSessionAttendance(validInput)
        ).rejects.toThrow('Booking record not found.');
      });

      it('should throw error when session is canceled', async () => {
        mockTx.sessionBooking.findUnique.mockResolvedValue({
          id: 'booking-1',
          clientId: 'client-456',
          status: BookingStatus.BOOKED,
          trainingSession: {
            startsAt: new Date(),
            status: TrainingSessionStatus.CANCELED,
            type: TrainingSessionType.GROUP,
          },
        });

        await expect(
          updateSessionAttendance(validInput)
        ).rejects.toThrow('Attendance cannot be updated for canceled sessions.');
      });

      it('should throw error when booking is canceled', async () => {
        mockTx.sessionBooking.findUnique.mockResolvedValue({
          id: 'booking-1',
          clientId: 'client-456',
          status: BookingStatus.CANCELED,
          trainingSession: {
            startsAt: new Date(),
            status: TrainingSessionStatus.SCHEDULED,
            type: TrainingSessionType.GROUP,
          },
        });

        await expect(
          updateSessionAttendance(validInput)
        ).rejects.toThrow('Attendance cannot be updated for canceled bookings.');
      });

      it('should throw error when trying to put client on waitlist for PRIVATE session', async () => {
        mockTx.sessionBooking.findUnique.mockResolvedValue({
          id: 'booking-1',
          clientId: 'client-456',
          status: BookingStatus.BOOKED,
          trainingSession: {
            startsAt: new Date(),
            status: TrainingSessionStatus.SCHEDULED,
            type: TrainingSessionType.PRIVATE,
          },
        });

        await expect(
          updateSessionAttendance({
            ...validInput,
            status: BookingStatus.WAITLIST,
          })
        ).rejects.toThrow('Private sessions cannot place a client on the waitlist.');
      });
    });

    describe('Status Updates', () => {
      it('should update booking status to ATTENDED', async () => {
        const bookingId = 'booking-1';
        mockTx.sessionBooking.findUnique.mockResolvedValue({
          id: bookingId,
          clientId: 'client-456',
          status: BookingStatus.BOOKED,
          trainingSession: {
            startsAt: new Date('2024-06-01T10:00:00'),
            status: TrainingSessionStatus.SCHEDULED,
            type: TrainingSessionType.GROUP,
          },
        });
        mockTx.clientSubscription.findMany.mockResolvedValue([]);
        mockTx.sessionBooking.update.mockResolvedValue({
          id: bookingId,
        });

        const result = await updateSessionAttendance(validInput);

        expect(mockTx.sessionBooking.update).toHaveBeenCalledWith({
          where: { id: bookingId },
          data: {
            status: BookingStatus.ATTENDED,
            attendedAt: expect.any(Date),
            canceledAt: null,
          },
          select: { id: true },
        });
        expect(result).toEqual({ id: bookingId });
      });

      it('should update booking status to MISSED', async () => {
        const bookingId = 'booking-1';
        mockTx.sessionBooking.findUnique.mockResolvedValue({
          id: bookingId,
          clientId: 'client-456',
          status: BookingStatus.BOOKED,
          trainingSession: {
            startsAt: new Date(),
            status: TrainingSessionStatus.SCHEDULED,
            type: TrainingSessionType.GROUP,
          },
        });
        mockTx.clientSubscription.findMany.mockResolvedValue([]);
        mockTx.sessionBooking.update.mockResolvedValue({
          id: bookingId,
        });

        await updateSessionAttendance({
          ...validInput,
          status: BookingStatus.MISSED,
        });

        expect(mockTx.sessionBooking.update).toHaveBeenCalledWith({
          where: { id: bookingId },
          data: {
            status: BookingStatus.MISSED,
            attendedAt: null,
            canceledAt: null,
          },
          select: { id: true },
        });
      });

      it('should update booking status to BOOKED', async () => {
        const bookingId = 'booking-1';
        mockTx.sessionBooking.findUnique.mockResolvedValue({
          id: bookingId,
          clientId: 'client-456',
          status: BookingStatus.MISSED,
          trainingSession: {
            startsAt: new Date(),
            status: TrainingSessionStatus.SCHEDULED,
            type: TrainingSessionType.GROUP,
          },
        });
        mockTx.clientSubscription.findMany.mockResolvedValue([]);
        mockTx.sessionBooking.update.mockResolvedValue({
          id: bookingId,
        });

        await updateSessionAttendance({
          ...validInput,
          status: BookingStatus.BOOKED,
        });

        expect(mockTx.sessionBooking.update).toHaveBeenCalled();
      });

      it('should allow WAITLIST status for GROUP sessions', async () => {
        const bookingId = 'booking-1';
        mockTx.sessionBooking.findUnique.mockResolvedValue({
          id: bookingId,
          clientId: 'client-456',
          status: BookingStatus.BOOKED,
          trainingSession: {
            startsAt: new Date(),
            status: TrainingSessionStatus.SCHEDULED,
            type: TrainingSessionType.GROUP,
          },
        });
        mockTx.clientSubscription.findMany.mockResolvedValue([]);
        mockTx.sessionBooking.update.mockResolvedValue({
          id: bookingId,
        });

        await updateSessionAttendance({
          ...validInput,
          status: BookingStatus.WAITLIST,
        });

        expect(mockTx.sessionBooking.update).toHaveBeenCalled();
      });
    });

    describe('Subscription Syncing', () => {
      it('should sync attended sessions count for subscriptions within window', async () => {
        const bookingId = 'booking-1';
        const sessionDate = new Date('2024-06-15T10:00:00');
        const subscriptionId = 'sub-1';

        mockTx.sessionBooking.findUnique.mockResolvedValue({
          id: bookingId,
          clientId: 'client-456',
          status: BookingStatus.BOOKED,
          trainingSession: {
            startsAt: sessionDate,
            status: TrainingSessionStatus.SCHEDULED,
            type: TrainingSessionType.GROUP,
          },
        });

        mockTx.clientSubscription.findMany.mockResolvedValue([
          {
            id: subscriptionId,
            startsAt: new Date('2024-06-01'),
            endsAt: new Date('2024-06-30'),
            renewsAt: null,
          },
        ]);

        mockTx.sessionBooking.update.mockResolvedValue({
          id: bookingId,
        });

        mockTx.sessionBooking.count.mockResolvedValue(3);
        mockTx.clientSubscription.update.mockResolvedValue({
          id: subscriptionId,
        });

        await updateSessionAttendance(validInput);

        expect(mockTx.clientSubscription.findMany).toHaveBeenCalledWith({
          where: { clientId: 'client-456' },
          select: {
            id: true,
            startsAt: true,
            endsAt: true,
            renewsAt: true,
          },
        });

        expect(mockTx.sessionBooking.count).toHaveBeenCalled();
        expect(mockTx.clientSubscription.update).toHaveBeenCalledWith({
          where: { id: subscriptionId },
          data: { sessionsUsed: 3 },
        });
      });

      it('should not sync subscriptions outside session window', async () => {
        const bookingId = 'booking-1';
        const sessionDate = new Date('2024-06-15T10:00:00');

        mockTx.sessionBooking.findUnique.mockResolvedValue({
          id: bookingId,
          clientId: 'client-456',
          status: BookingStatus.BOOKED,
          trainingSession: {
            startsAt: sessionDate,
            status: TrainingSessionStatus.SCHEDULED,
            type: TrainingSessionType.GROUP,
          },
        });

        // Subscription is before session date
        mockTx.clientSubscription.findMany.mockResolvedValue([
          {
            id: 'sub-1',
            startsAt: new Date('2024-05-01'),
            endsAt: new Date('2024-05-31'),
            renewsAt: null,
          },
        ]);

        mockTx.sessionBooking.update.mockResolvedValue({
          id: bookingId,
        });

        await updateSessionAttendance(validInput);

        // Should not call count or update for this subscription
        expect(mockTx.sessionBooking.count).not.toHaveBeenCalled();
        expect(mockTx.clientSubscription.update).not.toHaveBeenCalled();
      });

      it('should use renewsAt when available instead of endsAt', async () => {
        const bookingId = 'booking-1';
        const sessionDate = new Date('2024-06-15T10:00:00');
        const subscriptionId = 'sub-1';

        mockTx.sessionBooking.findUnique.mockResolvedValue({
          id: bookingId,
          clientId: 'client-456',
          status: BookingStatus.BOOKED,
          trainingSession: {
            startsAt: sessionDate,
            status: TrainingSessionStatus.SCHEDULED,
            type: TrainingSessionType.GROUP,
          },
        });

        // Has both renewsAt and endsAt - should use renewsAt
        mockTx.clientSubscription.findMany.mockResolvedValue([
          {
            id: subscriptionId,
            startsAt: new Date('2024-06-01'),
            endsAt: new Date('2024-12-31'),
            renewsAt: new Date('2024-06-30'),
          },
        ]);

        mockTx.sessionBooking.update.mockResolvedValue({
          id: bookingId,
        });

        mockTx.sessionBooking.count.mockResolvedValue(2);
        mockTx.clientSubscription.update.mockResolvedValue({
          id: subscriptionId,
        });

        await updateSessionAttendance(validInput);

        // Should be called because session is within the subscription window
        expect(mockTx.sessionBooking.count).toHaveBeenCalled();
      });

      it('should handle subscription with no end date (ongoing)', async () => {
        const bookingId = 'booking-1';
        const sessionDate = new Date('2024-06-15T10:00:00');
        const subscriptionId = 'sub-1';

        mockTx.sessionBooking.findUnique.mockResolvedValue({
          id: bookingId,
          clientId: 'client-456',
          status: BookingStatus.BOOKED,
          trainingSession: {
            startsAt: sessionDate,
            status: TrainingSessionStatus.SCHEDULED,
            type: TrainingSessionType.GROUP,
          },
        });

        mockTx.clientSubscription.findMany.mockResolvedValue([
          {
            id: subscriptionId,
            startsAt: new Date('2024-06-01'),
            endsAt: null,
            renewsAt: null,
          },
        ]);

        mockTx.sessionBooking.update.mockResolvedValue({
          id: bookingId,
        });

        mockTx.sessionBooking.count.mockResolvedValue(1);
        mockTx.clientSubscription.update.mockResolvedValue({
          id: subscriptionId,
        });

        await updateSessionAttendance(validInput);

        // Should sync because subscription has no end date
        expect(mockTx.sessionBooking.count).toHaveBeenCalled();
        expect(mockTx.clientSubscription.update).toHaveBeenCalled();
      });

      it('should handle multiple subscriptions', async () => {
        const bookingId = 'booking-1';
        const sessionDate = new Date('2024-06-15T10:00:00');

        mockTx.sessionBooking.findUnique.mockResolvedValue({
          id: bookingId,
          clientId: 'client-456',
          status: BookingStatus.BOOKED,
          trainingSession: {
            startsAt: sessionDate,
            status: TrainingSessionStatus.SCHEDULED,
            type: TrainingSessionType.GROUP,
          },
        });

        mockTx.clientSubscription.findMany.mockResolvedValue([
          {
            id: 'sub-1',
            startsAt: new Date('2024-06-01'),
            endsAt: new Date('2024-06-30'),
            renewsAt: null,
          },
          {
            id: 'sub-2',
            startsAt: new Date('2024-07-01'),
            endsAt: new Date('2024-07-31'),
            renewsAt: null,
          },
        ]);

        mockTx.sessionBooking.update.mockResolvedValue({
          id: bookingId,
        });

        mockTx.sessionBooking.count.mockResolvedValue(1);
        mockTx.clientSubscription.update.mockResolvedValue({
          id: 'sub-1',
        });

        await updateSessionAttendance(validInput);

        // Should sync first subscription (session is in June)
        expect(mockTx.sessionBooking.count).toHaveBeenCalledTimes(1);
        expect(mockTx.clientSubscription.update).toHaveBeenCalledTimes(1);
      });

      it('should count attended sessions excluding canceled sessions', async () => {
        const bookingId = 'booking-1';
        const sessionDate = new Date('2024-06-15T10:00:00');
        const subscriptionId = 'sub-1';

        mockTx.sessionBooking.findUnique.mockResolvedValue({
          id: bookingId,
          clientId: 'client-456',
          status: BookingStatus.BOOKED,
          trainingSession: {
            startsAt: sessionDate,
            status: TrainingSessionStatus.SCHEDULED,
            type: TrainingSessionType.GROUP,
          },
        });

        mockTx.clientSubscription.findMany.mockResolvedValue([
          {
            id: subscriptionId,
            startsAt: new Date('2024-06-01'),
            endsAt: new Date('2024-06-30'),
            renewsAt: null,
          },
        ]);

        mockTx.sessionBooking.update.mockResolvedValue({
          id: bookingId,
        });

        mockTx.sessionBooking.count.mockResolvedValue(2);

        await updateSessionAttendance(validInput);

        expect(mockTx.sessionBooking.count).toHaveBeenCalledWith({
          where: {
            clientId: 'client-456',
            status: BookingStatus.ATTENDED,
            trainingSession: {
              status: {
                not: TrainingSessionStatus.CANCELED,
              },
              startsAt: {
                gte: expect.any(Date),
                lte: expect.any(Date),
              },
            },
          },
        });
      });
    });

    describe('Transaction Handling', () => {
      it('should execute operations within a transaction', async () => {
        const bookingId = 'booking-1';

        mockTx.sessionBooking.findUnique.mockResolvedValue({
          id: bookingId,
          clientId: 'client-456',
          status: BookingStatus.BOOKED,
          trainingSession: {
            startsAt: new Date(),
            status: TrainingSessionStatus.SCHEDULED,
            type: TrainingSessionType.GROUP,
          },
        });
        mockTx.clientSubscription.findMany.mockResolvedValue([]);
        mockTx.sessionBooking.update.mockResolvedValue({
          id: bookingId,
        });

        await updateSessionAttendance(validInput);

        expect(mockDataStore.$transaction).toHaveBeenCalled();
      });

      it('should clear attended date for non-attended status', async () => {
        const bookingId = 'booking-1';

        mockTx.sessionBooking.findUnique.mockResolvedValue({
          id: bookingId,
          clientId: 'client-456',
          status: BookingStatus.ATTENDED,
          trainingSession: {
            startsAt: new Date(),
            status: TrainingSessionStatus.SCHEDULED,
            type: TrainingSessionType.GROUP,
          },
        });
        mockTx.clientSubscription.findMany.mockResolvedValue([]);
        mockTx.sessionBooking.update.mockResolvedValue({
          id: bookingId,
        });

        await updateSessionAttendance({
          ...validInput,
          status: BookingStatus.MISSED,
        });

        expect(mockTx.sessionBooking.update).toHaveBeenCalledWith({
          where: { id: bookingId },
          data: {
            status: BookingStatus.MISSED,
            attendedAt: null,
            canceledAt: null,
          },
          select: { id: true },
        });
      });
    });
  });
});
