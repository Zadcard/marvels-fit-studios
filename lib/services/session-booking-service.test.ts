// Mock must be first
import { mockGetPrisma, createMockPrisma } from '@/tests/test-utils';
import { vi } from 'vitest';

vi.mock('@/lib/services/session-booking-store', () => ({
  getSessionBookingStore: () => {
    const database = mockGetPrisma();
    return {
      findSession: (id: string) => database.trainingSession.findUnique({
        where: { id },
        select: expect.anything(),
      }),
      findClient: (id: string) => database.client.findUnique({ where: { id }, select: { id: true } }),
      findBooking: (trainingSessionId: string, clientId: string) => database.sessionBooking.findUnique({
        where: { trainingSessionId_clientId: { trainingSessionId, clientId } },
        select: { id: true, status: true },
      }),
      updateBooking: (id: string, data: Record<string, unknown>) =>
        database.sessionBooking.update(
          data.status === "CANCELED" && !("attendedAt" in data)
            ? { where: { id }, data }
            : { where: { id }, data, select: { id: true } }
        ),
      createBooking: (data: unknown) => database.sessionBooking.create({
        data, select: { id: true },
      }),
    };
  },
}));

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  BookingSource,
  BookingStatus,
  TrainingSessionStatus,
  TrainingSessionType,
} from '@/lib/supabase/domain';
import { createSessionBooking, cancelSessionBooking } from './session-booking-service';

describe('Session Booking Service', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    mockGetPrisma.mockReturnValue(mockPrisma);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('createSessionBooking', () => {
    const validInput = {
      trainingSessionId: 'session-123',
      clientId: 'client-456',
    };

    describe('Validation', () => {
      it('should throw error when session does not exist', async () => {
        mockPrisma.trainingSession.findUnique.mockResolvedValue(null);

        await expect(
          createSessionBooking(validInput)
        ).rejects.toThrow('Session record not found.');
      });

      it('should throw error when client does not exist', async () => {
        mockPrisma.trainingSession.findUnique.mockResolvedValue({
          id: 'session-123',
          type: TrainingSessionType.GROUP,
          status: TrainingSessionStatus.SCHEDULED,
          capacity: 10,
          bookings: [],
        });
        mockPrisma.client.findUnique.mockResolvedValue(null);

        await expect(
          createSessionBooking(validInput)
        ).rejects.toThrow('Client record not found.');
      });

      it('should throw error when session is canceled', async () => {
        mockPrisma.trainingSession.findUnique.mockResolvedValue({
          id: 'session-123',
          type: TrainingSessionType.GROUP,
          status: TrainingSessionStatus.CANCELED,
          capacity: 10,
          bookings: [],
        });
        mockPrisma.client.findUnique.mockResolvedValue({ id: 'client-456' });

        await expect(
          createSessionBooking(validInput)
        ).rejects.toThrow('Bookings can only be changed for active sessions.');
      });

      it('should throw error when session is completed', async () => {
        mockPrisma.trainingSession.findUnique.mockResolvedValue({
          id: 'session-123',
          type: TrainingSessionType.GROUP,
          status: TrainingSessionStatus.COMPLETED,
          capacity: 10,
          bookings: [],
        });
        mockPrisma.client.findUnique.mockResolvedValue({ id: 'client-456' });

        await expect(
          createSessionBooking(validInput)
        ).rejects.toThrow('Bookings can only be changed for active sessions.');
      });
    });

    describe('Duplicate Booking Prevention', () => {
      it('should throw error when client already has active booking', async () => {
        mockPrisma.trainingSession.findUnique.mockResolvedValue({
          id: 'session-123',
          type: TrainingSessionType.GROUP,
          status: TrainingSessionStatus.SCHEDULED,
          capacity: 10,
          bookings: [],
        });
        mockPrisma.client.findUnique.mockResolvedValue({ id: 'client-456' });
        mockPrisma.sessionBooking.findUnique.mockResolvedValue({
          id: 'booking-1',
          status: BookingStatus.BOOKED,
        });

        await expect(
          createSessionBooking(validInput)
        ).rejects.toThrow('This client is already assigned to the session.');
      });

      it('should throw error when client has attended booking', async () => {
        mockPrisma.trainingSession.findUnique.mockResolvedValue({
          id: 'session-123',
          type: TrainingSessionType.GROUP,
          status: TrainingSessionStatus.SCHEDULED,
          capacity: 10,
          bookings: [],
        });
        mockPrisma.client.findUnique.mockResolvedValue({ id: 'client-456' });
        mockPrisma.sessionBooking.findUnique.mockResolvedValue({
          id: 'booking-1',
          status: BookingStatus.ATTENDED,
        });

        await expect(
          createSessionBooking(validInput)
        ).rejects.toThrow('This client is already assigned to the session.');
      });

      it('should throw error when client is on waitlist', async () => {
        mockPrisma.trainingSession.findUnique.mockResolvedValue({
          id: 'session-123',
          type: TrainingSessionType.GROUP,
          status: TrainingSessionStatus.SCHEDULED,
          capacity: 10,
          bookings: [],
        });
        mockPrisma.client.findUnique.mockResolvedValue({ id: 'client-456' });
        mockPrisma.sessionBooking.findUnique.mockResolvedValue({
          id: 'booking-1',
          status: BookingStatus.WAITLIST,
        });

        await expect(
          createSessionBooking(validInput)
        ).rejects.toThrow('This client is already assigned to the session.');
      });

      it('should allow re-booking if previous booking was canceled', async () => {
        const existingBookingId = 'existing-booking-1';
        mockPrisma.trainingSession.findUnique.mockResolvedValue({
          id: 'session-123',
          type: TrainingSessionType.GROUP,
          status: TrainingSessionStatus.SCHEDULED,
          capacity: 10,
          bookings: [],
        });
        mockPrisma.client.findUnique.mockResolvedValue({ id: 'client-456' });
        mockPrisma.sessionBooking.findUnique.mockResolvedValue({
          id: existingBookingId,
          status: BookingStatus.CANCELED,
        });
        mockPrisma.sessionBooking.update.mockResolvedValue({
          id: existingBookingId,
        });

        const result = await createSessionBooking(validInput);

        expect(result).toEqual({ id: existingBookingId });
        expect(mockPrisma.sessionBooking.update).toHaveBeenCalledWith({
          where: { id: existingBookingId },
          data: {
            status: BookingStatus.BOOKED,
            source: BookingSource.MANUAL,
            bookedAt: expect.any(Date),
            attendedAt: null,
            canceledAt: null,
          },
          select: { id: true },
        });
      });
    });

    describe('Capacity Management', () => {
      it('should throw error when session is at capacity (GROUP)', async () => {
        mockPrisma.trainingSession.findUnique.mockResolvedValue({
          id: 'session-123',
          type: TrainingSessionType.GROUP,
          status: TrainingSessionStatus.SCHEDULED,
          capacity: 2,
          bookings: [
            {
              id: 'booking-1',
              clientId: 'client-111',
              status: BookingStatus.BOOKED,
            },
            {
              id: 'booking-2',
              clientId: 'client-222',
              status: BookingStatus.BOOKED,
            },
          ],
        });
        mockPrisma.client.findUnique.mockResolvedValue({ id: 'client-456' });
        mockPrisma.sessionBooking.findUnique.mockResolvedValue(null);

        await expect(
          createSessionBooking(validInput)
        ).rejects.toThrow('This session is already at capacity.');
      });

      it('should allow booking when session has available capacity', async () => {
        const newBookingId = 'new-booking-1';
        mockPrisma.trainingSession.findUnique.mockResolvedValue({
          id: 'session-123',
          type: TrainingSessionType.GROUP,
          status: TrainingSessionStatus.SCHEDULED,
          capacity: 10,
          bookings: [
            {
              id: 'booking-1',
              clientId: 'client-111',
              status: BookingStatus.BOOKED,
            },
          ],
        });
        mockPrisma.client.findUnique.mockResolvedValue({ id: 'client-456' });
        mockPrisma.sessionBooking.findUnique.mockResolvedValue(null);
        mockPrisma.sessionBooking.create.mockResolvedValue({
          id: newBookingId,
        });

        const result = await createSessionBooking(validInput);

        expect(result).toEqual({ id: newBookingId });
        expect(mockPrisma.sessionBooking.create).toHaveBeenCalled();
      });

      it('should not enforce capacity limit for sessions with null capacity', async () => {
        const newBookingId = 'new-booking-1';
        mockPrisma.trainingSession.findUnique.mockResolvedValue({
          id: 'session-123',
          type: TrainingSessionType.GROUP,
          status: TrainingSessionStatus.SCHEDULED,
          capacity: null,
          bookings: Array.from({ length: 100 }, (_, i) => ({
            id: `booking-${i}`,
            clientId: `client-${i}`,
            status: BookingStatus.BOOKED,
          })),
        });
        mockPrisma.client.findUnique.mockResolvedValue({ id: 'client-456' });
        mockPrisma.sessionBooking.findUnique.mockResolvedValue(null);
        mockPrisma.sessionBooking.create.mockResolvedValue({
          id: newBookingId,
        });

        const result = await createSessionBooking(validInput);

        expect(result).toEqual({ id: newBookingId });
      });
    });

    describe('PRIVATE Session Handling', () => {
      it('should cancel previous booking when assigning different client to PRIVATE session', async () => {
        const previousBookingId = 'previous-booking-1';
        const newBookingId = 'new-booking-1';

        mockPrisma.trainingSession.findUnique.mockResolvedValue({
          id: 'session-123',
          type: TrainingSessionType.PRIVATE,
          status: TrainingSessionStatus.SCHEDULED,
          capacity: 1,
          bookings: [
            {
              id: previousBookingId,
              clientId: 'client-old',
              status: BookingStatus.BOOKED,
            },
          ],
        });
        mockPrisma.client.findUnique.mockResolvedValue({ id: 'client-456' });
        mockPrisma.sessionBooking.findUnique.mockResolvedValue(null);
        mockPrisma.sessionBooking.update.mockResolvedValue({
          id: previousBookingId,
        });
        mockPrisma.sessionBooking.create.mockResolvedValue({
          id: newBookingId,
        });

        const result = await createSessionBooking(validInput);

        expect(mockPrisma.sessionBooking.update).toHaveBeenCalledWith({
          where: { id: previousBookingId },
          data: {
            status: BookingStatus.CANCELED,
            canceledAt: expect.any(Date),
          },
        });
        expect(mockPrisma.sessionBooking.create).toHaveBeenCalled();
        expect(result).toEqual({ id: newBookingId });
      });

      it('should not cancel previous booking when assigning same client to PRIVATE session', async () => {
        const bookingId = 'booking-1';

        mockPrisma.trainingSession.findUnique.mockResolvedValue({
          id: 'session-123',
          type: TrainingSessionType.PRIVATE,
          status: TrainingSessionStatus.SCHEDULED,
          capacity: 1,
          bookings: [
            {
              id: bookingId,
              clientId: 'client-456',
              status: BookingStatus.BOOKED,
            },
          ],
        });
        mockPrisma.client.findUnique.mockResolvedValue({ id: 'client-456' });
        mockPrisma.sessionBooking.findUnique.mockResolvedValue({
          id: bookingId,
          status: BookingStatus.BOOKED,
        });

        await expect(
          createSessionBooking(validInput)
        ).rejects.toThrow('This client is already assigned to the session.');
      });

      it('should allow booking PRIVATE session when it has no bookings', async () => {
        const newBookingId = 'new-booking-1';

        mockPrisma.trainingSession.findUnique.mockResolvedValue({
          id: 'session-123',
          type: TrainingSessionType.PRIVATE,
          status: TrainingSessionStatus.SCHEDULED,
          capacity: 1,
          bookings: [],
        });
        mockPrisma.client.findUnique.mockResolvedValue({ id: 'client-456' });
        mockPrisma.sessionBooking.findUnique.mockResolvedValue(null);
        mockPrisma.sessionBooking.create.mockResolvedValue({
          id: newBookingId,
        });

        const result = await createSessionBooking(validInput);

        expect(result).toEqual({ id: newBookingId });
        expect(mockPrisma.sessionBooking.create).toHaveBeenCalled();
      });
    });

    describe('Booking Creation', () => {
      it('should create new booking with correct data', async () => {
        const newBookingId = 'new-booking-1';

        mockPrisma.trainingSession.findUnique.mockResolvedValue({
          id: 'session-123',
          type: TrainingSessionType.GROUP,
          status: TrainingSessionStatus.SCHEDULED,
          capacity: 10,
          bookings: [],
        });
        mockPrisma.client.findUnique.mockResolvedValue({ id: 'client-456' });
        mockPrisma.sessionBooking.findUnique.mockResolvedValue(null);
        mockPrisma.sessionBooking.create.mockResolvedValue({
          id: newBookingId,
        });

        const result = await createSessionBooking(validInput);

        expect(mockPrisma.sessionBooking.create).toHaveBeenCalledWith({
          data: {
            trainingSessionId: validInput.trainingSessionId,
            clientId: validInput.clientId,
            status: BookingStatus.BOOKED,
            source: BookingSource.MANUAL,
          },
          select: { id: true },
        });
        expect(result).toEqual({ id: newBookingId });
      });
    });
  });

  describe('cancelSessionBooking', () => {
    const validInput = {
      trainingSessionId: 'session-123',
      clientId: 'client-456',
    };

    it('should throw error when booking does not exist', async () => {
      mockPrisma.sessionBooking.findUnique.mockResolvedValue(null);

      await expect(
        cancelSessionBooking(validInput)
      ).rejects.toThrow('Booking record not found.');
    });

    it('should return booking as-is if already canceled', async () => {
      const bookingId = 'booking-1';
      mockPrisma.sessionBooking.findUnique.mockResolvedValue({
        id: bookingId,
        status: BookingStatus.CANCELED,
      });

      const result = await cancelSessionBooking(validInput);

      expect(result).toEqual({
        id: bookingId,
        status: BookingStatus.CANCELED,
      });
      expect(mockPrisma.sessionBooking.update).not.toHaveBeenCalled();
    });

    it('should cancel booking if currently booked', async () => {
      const bookingId = 'booking-1';
      mockPrisma.sessionBooking.findUnique.mockResolvedValue({
        id: bookingId,
        status: BookingStatus.BOOKED,
      });
      mockPrisma.sessionBooking.update.mockResolvedValue({
        id: bookingId,
      });

      const result = await cancelSessionBooking(validInput);

      expect(mockPrisma.sessionBooking.update).toHaveBeenCalledWith({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CANCELED,
          attendedAt: null,
          canceledAt: expect.any(Date),
        },
        select: { id: true },
      });
      expect(result).toEqual({ id: bookingId });
    });

    it('should cancel booking if currently attended', async () => {
      const bookingId = 'booking-1';
      mockPrisma.sessionBooking.findUnique.mockResolvedValue({
        id: bookingId,
        status: BookingStatus.ATTENDED,
      });
      mockPrisma.sessionBooking.update.mockResolvedValue({
        id: bookingId,
      });

      const result = await cancelSessionBooking(validInput);

      expect(mockPrisma.sessionBooking.update).toHaveBeenCalled();
      expect(result).toEqual({ id: bookingId });
    });

    it('should cancel booking if on waitlist', async () => {
      const bookingId = 'booking-1';
      mockPrisma.sessionBooking.findUnique.mockResolvedValue({
        id: bookingId,
        status: BookingStatus.WAITLIST,
      });
      mockPrisma.sessionBooking.update.mockResolvedValue({
        id: bookingId,
      });

      const result = await cancelSessionBooking(validInput);

      expect(mockPrisma.sessionBooking.update).toHaveBeenCalled();
      expect(result).toEqual({ id: bookingId });
    });

    it('should clear attended and canceled dates on cancel', async () => {
      const bookingId = 'booking-1';
      mockPrisma.sessionBooking.findUnique.mockResolvedValue({
        id: bookingId,
        status: BookingStatus.BOOKED,
      });
      mockPrisma.sessionBooking.update.mockResolvedValue({
        id: bookingId,
      });

      await cancelSessionBooking(validInput);

      expect(mockPrisma.sessionBooking.update).toHaveBeenCalledWith({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CANCELED,
          attendedAt: null,
          canceledAt: expect.any(Date),
        },
        select: { id: true },
      });
    });
  });
});
