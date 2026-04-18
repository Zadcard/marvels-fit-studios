import { describe, it, expect } from 'vitest';
import { TrainingSessionType, TrainingSessionStatus } from '@prisma/client';
import {
  createTrainingSessionSchema,
  updateTrainingSessionSchema,
  cancelTrainingSessionSchema,
  deleteTrainingSessionSchema,
  bulkUpdateTrainingSessionsSchema,
} from './training-session';

describe('Training Session Validators', () => {
  const validInput = {
    title: 'Strength Training',
    description: 'Full body strength workout',
    type: TrainingSessionType.GROUP,
    status: TrainingSessionStatus.SCHEDULED,
    coachId: 'coach-123',
    location: 'Studio A',
    startsAt: '2024-06-01T10:00:00Z',
    endsAt: '2024-06-01T11:00:00Z',
    capacity: 10,
  };

  describe('createTrainingSessionSchema', () => {
    it('should accept valid session input', () => {
      const result = createTrainingSessionSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should reject short title (less than 2 characters)', () => {
      const input = { ...validInput, title: 'A' };
      const result = createTrainingSessionSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should accept empty title when exactly empty string', () => {
      const input = { ...validInput, title: '' };
      const result = createTrainingSessionSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject title with only whitespace', () => {
      const input = { ...validInput, title: '   ' };
      const result = createTrainingSessionSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should trim title whitespace', () => {
      const input = { ...validInput, title: '  Strength Training  ' };
      const result = createTrainingSessionSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Strength Training');
      }
    });

    it('should reject description longer than 500 characters', () => {
      const longDescription = 'a'.repeat(501);
      const input = { ...validInput, description: longDescription };
      const result = createTrainingSessionSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should accept optional description', () => {
      const input = { ...validInput, description: undefined };
      const result = createTrainingSessionSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should accept empty string as description', () => {
      const input = { ...validInput, description: '' };
      const result = createTrainingSessionSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject empty coachId', () => {
      const input = { ...validInput, coachId: '' };
      const result = createTrainingSessionSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject invalid type enum', () => {
      const input = { ...validInput, type: 'INVALID_TYPE' };
      const result = createTrainingSessionSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject invalid status enum', () => {
      const input = { ...validInput, status: 'INVALID_STATUS' };
      const result = createTrainingSessionSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should accept location up to 120 characters', () => {
      const location = 'a'.repeat(120);
      const input = { ...validInput, location };
      const result = createTrainingSessionSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject location longer than 120 characters', () => {
      const location = 'a'.repeat(121);
      const input = { ...validInput, location };
      const result = createTrainingSessionSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject non-integer capacity', () => {
      const input = { ...validInput, capacity: 10.5 };
      const result = createTrainingSessionSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject zero capacity', () => {
      const input = { ...validInput, capacity: 0 };
      const result = createTrainingSessionSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject negative capacity', () => {
      const input = { ...validInput, capacity: -1 };
      const result = createTrainingSessionSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject capacity greater than 100', () => {
      const input = { ...validInput, capacity: 101 };
      const result = createTrainingSessionSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should accept null capacity', () => {
      const input = { ...validInput, capacity: null };
      const result = createTrainingSessionSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject invalid start datetime', () => {
      const input = { ...validInput, startsAt: 'not-a-date' };
      const result = createTrainingSessionSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject invalid end datetime', () => {
      const input = { ...validInput, endsAt: 'not-a-date' };
      const result = createTrainingSessionSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject when end time is before start time', () => {
      const input = {
        ...validInput,
        startsAt: '2024-06-01T11:00:00Z',
        endsAt: '2024-06-01T10:00:00Z',
      };
      const result = createTrainingSessionSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.path[0] === 'endsAt')).toBe(true);
      }
    });

    it('should reject when end time equals start time', () => {
      const input = {
        ...validInput,
        startsAt: '2024-06-01T10:00:00Z',
        endsAt: '2024-06-01T10:00:00Z',
      };
      const result = createTrainingSessionSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject PRIVATE session with capacity not equal to 1', () => {
      const input = {
        ...validInput,
        type: TrainingSessionType.PRIVATE,
        capacity: 2,
      };
      const result = createTrainingSessionSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.path[0] === 'capacity')).toBe(true);
      }
    });

    it('should accept PRIVATE session with capacity of 1', () => {
      const input = {
        ...validInput,
        type: TrainingSessionType.PRIVATE,
        capacity: 1,
      };
      const result = createTrainingSessionSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should accept GROUP session with any valid capacity', () => {
      const input = {
        ...validInput,
        type: TrainingSessionType.GROUP,
        capacity: 10,
      };
      const result = createTrainingSessionSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe('updateTrainingSessionSchema', () => {
    it('should accept valid update input with sessionId', () => {
      const input = { ...validInput, sessionId: 'session-123' };
      const result = updateTrainingSessionSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject empty sessionId', () => {
      const input = { ...validInput, sessionId: '' };
      const result = updateTrainingSessionSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject missing sessionId', () => {
      const result = updateTrainingSessionSchema.safeParse(validInput);
      expect(result.success).toBe(false);
    });
  });

  describe('cancelTrainingSessionSchema', () => {
    it('should accept valid cancel input', () => {
      const input = { sessionId: 'session-123' };
      const result = cancelTrainingSessionSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject empty sessionId', () => {
      const input = { sessionId: '' };
      const result = cancelTrainingSessionSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should trim sessionId whitespace', () => {
      const input = { sessionId: '  session-123  ' };
      const result = cancelTrainingSessionSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sessionId).toBe('session-123');
      }
    });
  });

  describe('deleteTrainingSessionSchema', () => {
    it('should accept valid delete input', () => {
      const input = { sessionId: 'session-123' };
      const result = deleteTrainingSessionSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject empty sessionId', () => {
      const input = { sessionId: '' };
      const result = deleteTrainingSessionSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe('bulkUpdateTrainingSessionsSchema', () => {
    it('should accept valid bulk update input', () => {
      const input = {
        sessionIds: ['session-1', 'session-2'],
        action: 'CANCEL' as const,
      };
      const result = bulkUpdateTrainingSessionsSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject empty sessionIds array', () => {
      const input = {
        sessionIds: [],
        action: 'CANCEL' as const,
      };
      const result = bulkUpdateTrainingSessionsSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject empty sessionId in array', () => {
      const input = {
        sessionIds: ['session-1', ''],
        action: 'CANCEL' as const,
      };
      const result = bulkUpdateTrainingSessionsSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should accept REASSIGN_COACH action with coachId', () => {
      const input = {
        sessionIds: ['session-1'],
        action: 'REASSIGN_COACH' as const,
        coachId: 'coach-456',
      };
      const result = bulkUpdateTrainingSessionsSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject REASSIGN_COACH action without coachId', () => {
      const input = {
        sessionIds: ['session-1'],
        action: 'REASSIGN_COACH' as const,
      };
      const result = bulkUpdateTrainingSessionsSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject REASSIGN_COACH action with empty coachId', () => {
      const input = {
        sessionIds: ['session-1'],
        action: 'REASSIGN_COACH' as const,
        coachId: '',
      };
      const result = bulkUpdateTrainingSessionsSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should accept UPDATE_LOCATION action with location', () => {
      const input = {
        sessionIds: ['session-1'],
        action: 'UPDATE_LOCATION' as const,
        location: 'Studio B',
      };
      const result = bulkUpdateTrainingSessionsSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject UPDATE_LOCATION action without location', () => {
      const input = {
        sessionIds: ['session-1'],
        action: 'UPDATE_LOCATION' as const,
      };
      const result = bulkUpdateTrainingSessionsSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject UPDATE_LOCATION action with empty location', () => {
      const input = {
        sessionIds: ['session-1'],
        action: 'UPDATE_LOCATION' as const,
        location: '',
      };
      const result = bulkUpdateTrainingSessionsSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should accept UPDATE_CAPACITY action with capacity', () => {
      const input = {
        sessionIds: ['session-1'],
        action: 'UPDATE_CAPACITY' as const,
        capacity: 15,
      };
      const result = bulkUpdateTrainingSessionsSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject UPDATE_CAPACITY action without capacity', () => {
      const input = {
        sessionIds: ['session-1'],
        action: 'UPDATE_CAPACITY' as const,
      };
      const result = bulkUpdateTrainingSessionsSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject UPDATE_CAPACITY action with null capacity', () => {
      const input = {
        sessionIds: ['session-1'],
        action: 'UPDATE_CAPACITY' as const,
        capacity: null,
      };
      const result = bulkUpdateTrainingSessionsSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should accept CANCEL action without optional fields', () => {
      const input = {
        sessionIds: ['session-1'],
        action: 'CANCEL' as const,
      };
      const result = bulkUpdateTrainingSessionsSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject invalid action', () => {
      const input = {
        sessionIds: ['session-1'],
        action: 'INVALID_ACTION',
      };
      const result = bulkUpdateTrainingSessionsSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });
});
