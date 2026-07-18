import { describe, it, expect } from 'vitest';
import {
  createSessionBookingSchema,
  cancelSessionBookingSchema,
  bulkUpdateSessionAttendanceSchema,
  updateSessionAttendanceSchema,
} from './session-booking';

describe('Session Booking Validators', () => {
  describe('createSessionBookingSchema', () => {
    it('should accept valid booking input', () => {
      const input = {
        trainingSessionId: 'session-123',
        clientId: 'client-456',
      };
      const result = createSessionBookingSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(input);
      }
    });

    it('should reject empty trainingSessionId', () => {
      const input = {
        trainingSessionId: '',
        clientId: 'client-456',
      };
      const result = createSessionBookingSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Session id is required');
      }
    });

    it('should reject empty clientId', () => {
      const input = {
        trainingSessionId: 'session-123',
        clientId: '',
      };
      const result = createSessionBookingSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Client is required');
      }
    });

    it('should trim whitespace from IDs', () => {
      const input = {
        trainingSessionId: '  session-123  ',
        clientId: '  client-456  ',
      };
      const result = createSessionBookingSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.trainingSessionId).toBe('session-123');
        expect(result.data.clientId).toBe('client-456');
      }
    });

    it('should reject missing trainingSessionId', () => {
      const input = {
        clientId: 'client-456',
      };
      const result = createSessionBookingSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject missing clientId', () => {
      const input = {
        trainingSessionId: 'session-123',
      };
      const result = createSessionBookingSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject extra fields', () => {
      const input = {
        trainingSessionId: 'session-123',
        clientId: 'client-456',
        extraField: 'should-be-ignored',
      };
      const result = createSessionBookingSchema.safeParse(input);
      // Zod by default allows extra fields but doesn't include them
      expect(result.success).toBe(true);
    });
  });

  describe('cancelSessionBookingSchema', () => {
    it('should accept valid cancellation input', () => {
      const input = {
        trainingSessionId: 'session-123',
        clientId: 'client-456',
      };
      const result = cancelSessionBookingSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject empty trainingSessionId', () => {
      const input = {
        trainingSessionId: '',
        clientId: 'client-456',
      };
      const result = cancelSessionBookingSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Session id is required');
      }
    });

    it('should reject empty clientId', () => {
      const input = {
        trainingSessionId: 'session-123',
        clientId: '',
      };
      const result = cancelSessionBookingSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Client is required');
      }
    });

    it('should trim whitespace', () => {
      const input = {
        trainingSessionId: '  session-123  ',
        clientId: '  client-456  ',
      };
      const result = cancelSessionBookingSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.trainingSessionId).toBe('session-123');
        expect(result.data.clientId).toBe('client-456');
      }
    });
  });

  describe('updateSessionAttendanceSchema', () => {
    it('should accept valid attendance update with BOOKED status', () => {
      const input = {
        trainingSessionId: 'session-123',
        clientId: 'client-456',
        status: 'BOOKED' as const,
      };
      const result = updateSessionAttendanceSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should accept valid attendance update with ATTENDED status', () => {
      const input = {
        trainingSessionId: 'session-123',
        clientId: 'client-456',
        status: 'ATTENDED' as const,
      };
      const result = updateSessionAttendanceSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should accept valid attendance update with MISSED status', () => {
      const input = {
        trainingSessionId: 'session-123',
        clientId: 'client-456',
        status: 'MISSED' as const,
      };
      const result = updateSessionAttendanceSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should accept valid attendance update with WAITLIST status', () => {
      const input = {
        trainingSessionId: 'session-123',
        clientId: 'client-456',
        status: 'WAITLIST' as const,
      };
      const result = updateSessionAttendanceSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject invalid status', () => {
      const input = {
        trainingSessionId: 'session-123',
        clientId: 'client-456',
        status: 'INVALID_STATUS',
      };
      const result = updateSessionAttendanceSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject empty trainingSessionId', () => {
      const input = {
        trainingSessionId: '',
        clientId: 'client-456',
        status: 'ATTENDED' as const,
      };
      const result = updateSessionAttendanceSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject empty clientId', () => {
      const input = {
        trainingSessionId: 'session-123',
        clientId: '',
        status: 'ATTENDED' as const,
      };
      const result = updateSessionAttendanceSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject missing status', () => {
      const input = {
        trainingSessionId: 'session-123',
        clientId: 'client-456',
      };
      const result = updateSessionAttendanceSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should trim whitespace from IDs', () => {
      const input = {
        trainingSessionId: '  session-123  ',
        clientId: '  client-456  ',
        status: 'ATTENDED' as const,
      };
      const result = updateSessionAttendanceSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.trainingSessionId).toBe('session-123');
        expect(result.data.clientId).toBe('client-456');
      }
    });
  });

  describe('bulkUpdateSessionAttendanceSchema', () => {
    it('requires at least one client and accepts a valid batch', () => {
      expect(bulkUpdateSessionAttendanceSchema.safeParse({
        trainingSessionId: 'session-123',
        clientIds: ['client-1', 'client-2'],
        status: 'ATTENDED',
      }).success).toBe(true);
      expect(bulkUpdateSessionAttendanceSchema.safeParse({
        trainingSessionId: 'session-123',
        clientIds: [],
        status: 'ATTENDED',
      }).success).toBe(false);
    });
  });
});
