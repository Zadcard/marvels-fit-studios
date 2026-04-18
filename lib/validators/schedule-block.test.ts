import { describe, it, expect } from 'vitest';
import { TrainingSessionType, ScheduleBlockStatus } from '@prisma/client';
import {
  createScheduleBlockSchema,
  updateScheduleBlockSchema,
  scheduleBlockRosterMutationSchema,
  reassignScheduleBlockCoachSchema,
  scheduleBlockLifecycleSchema,
  duplicateScheduleBlockSchema,
} from './schedule-block';

describe('Schedule Block Validators', () => {
  const validInput = {
    title: 'Monday Strength Training',
    description: 'Full body strength workout',
    sessionType: TrainingSessionType.GROUP,
    status: ScheduleBlockStatus.ACTIVE,
    recurrenceType: 'WEEKLY' as const,
    recurrenceDays: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
    startsOn: '2024-06-01',
    endsOn: '2024-12-31',
    startTime: '10:00',
    endTime: '11:00',
    timezone: 'America/New_York',
    coachId: 'coach-123',
    groupId: 'group-456',
    clientIds: ['client-1', 'client-2'],
    location: 'Studio A',
    capacity: 15,
  };

  describe('createScheduleBlockSchema', () => {
    it('should accept valid schedule block input', () => {
      const result = createScheduleBlockSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should reject short title (less than 2 characters)', () => {
      const input = { ...validInput, title: 'A' };
      const result = createScheduleBlockSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should trim title whitespace', () => {
      const input = { ...validInput, title: '  Monday Strength Training  ' };
      const result = createScheduleBlockSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Monday Strength Training');
      }
    });

    it('should reject description longer than 500 characters', () => {
      const longDescription = 'a'.repeat(501);
      const input = { ...validInput, description: longDescription };
      const result = createScheduleBlockSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should accept optional description', () => {
      const input = { ...validInput, description: undefined };
      const result = createScheduleBlockSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should accept empty string as description', () => {
      const input = { ...validInput, description: '' };
      const result = createScheduleBlockSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject invalid date format for startsOn', () => {
      const input = { ...validInput, startsOn: '06-01-2024' };
      const result = createScheduleBlockSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject invalid date format for endsOn', () => {
      const input = { ...validInput, endsOn: '12/31/2024' };
      const result = createScheduleBlockSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should accept valid YYYY-MM-DD format', () => {
      const input = { ...validInput, startsOn: '2024-06-01' };
      const result = createScheduleBlockSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject invalid time format for startTime', () => {
      const input = { ...validInput, startTime: '1000' };
      const result = createScheduleBlockSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject invalid time format for endTime', () => {
      const input = { ...validInput, endTime: '11' };
      const result = createScheduleBlockSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should accept valid HH:MM time format', () => {
      const input = { ...validInput, startTime: '10:00', endTime: '11:00' };
      const result = createScheduleBlockSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject when endTime is before startTime', () => {
      const input = { ...validInput, startTime: '11:00', endTime: '10:00' };
      const result = createScheduleBlockSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.path[0] === 'endTime')).toBe(true);
      }
    });

    it('should reject when endTime equals startTime', () => {
      const input = { ...validInput, startTime: '10:00', endTime: '10:00' };
      const result = createScheduleBlockSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject when endsOn is before startsOn', () => {
      const input = {
        ...validInput,
        startsOn: '2024-12-31',
        endsOn: '2024-06-01',
      };
      const result = createScheduleBlockSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.path[0] === 'endsOn')).toBe(true);
      }
    });

    it('should accept when endsOn equals startsOn', () => {
      const input = {
        ...validInput,
        startsOn: '2024-06-01',
        endsOn: '2024-06-01',
      };
      const result = createScheduleBlockSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject empty timezone', () => {
      const input = { ...validInput, timezone: '' };
      const result = createScheduleBlockSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject empty coachId', () => {
      const input = { ...validInput, coachId: '' };
      const result = createScheduleBlockSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should accept optional groupId', () => {
      const input = { ...validInput, groupId: undefined };
      const result = createScheduleBlockSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should accept empty string as groupId', () => {
      const input = { ...validInput, groupId: '' };
      const result = createScheduleBlockSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should default clientIds to empty array', () => {
      const input = { ...validInput, clientIds: undefined };
      const result = createScheduleBlockSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.clientIds).toEqual([]);
      }
    });

    it('should reject empty clientId in array', () => {
      const input = { ...validInput, clientIds: ['client-1', ''] };
      const result = createScheduleBlockSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should accept location up to 120 characters', () => {
      const location = 'a'.repeat(120);
      const input = { ...validInput, location };
      const result = createScheduleBlockSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject location longer than 120 characters', () => {
      const location = 'a'.repeat(121);
      const input = { ...validInput, location };
      const result = createScheduleBlockSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject non-integer capacity', () => {
      const input = { ...validInput, capacity: 15.5 };
      const result = createScheduleBlockSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject zero capacity', () => {
      const input = { ...validInput, capacity: 0 };
      const result = createScheduleBlockSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject negative capacity', () => {
      const input = { ...validInput, capacity: -1 };
      const result = createScheduleBlockSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject capacity greater than 100', () => {
      const input = { ...validInput, capacity: 101 };
      const result = createScheduleBlockSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should accept null capacity', () => {
      const input = { ...validInput, capacity: null };
      const result = createScheduleBlockSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject PRIVATE block with capacity not equal to 1', () => {
      const input = {
        ...validInput,
        sessionType: TrainingSessionType.PRIVATE,
        capacity: 2,
      };
      const result = createScheduleBlockSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.path[0] === 'capacity')).toBe(true);
      }
    });

    it('should accept PRIVATE block with capacity of 1', () => {
      const input = {
        ...validInput,
        sessionType: TrainingSessionType.PRIVATE,
        capacity: 1,
        clientIds: [], // PRIVATE blocks can't have multiple clients
      };
      const result = createScheduleBlockSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject PRIVATE block with multiple clients', () => {
      const input = {
        ...validInput,
        sessionType: TrainingSessionType.PRIVATE,
        capacity: 1,
        clientIds: ['client-1', 'client-2'],
      };
      const result = createScheduleBlockSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.path[0] === 'clientIds')).toBe(true);
      }
    });

    it('should accept PRIVATE block with single client', () => {
      const input = {
        ...validInput,
        sessionType: TrainingSessionType.PRIVATE,
        capacity: 1,
        clientIds: ['client-1'],
      };
      const result = createScheduleBlockSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should accept GROUP block with multiple clients', () => {
      const input = {
        ...validInput,
        sessionType: TrainingSessionType.GROUP,
        clientIds: ['client-1', 'client-2'],
      };
      const result = createScheduleBlockSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject empty recurrenceDays array', () => {
      const input = { ...validInput, recurrenceDays: [] };
      const result = createScheduleBlockSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject empty day in recurrenceDays', () => {
      const input = { ...validInput, recurrenceDays: ['MONDAY', ''] };
      const result = createScheduleBlockSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe('updateScheduleBlockSchema', () => {
    it('should accept valid update input with blockId and scope', () => {
      const input = {
        ...validInput,
        blockId: 'block-123',
        scope: 'THIS_AND_FUTURE' as const,
      };
      const result = updateScheduleBlockSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should accept update with ENTIRE_SERIES scope', () => {
      const input = {
        ...validInput,
        blockId: 'block-123',
        scope: 'ENTIRE_SERIES' as const,
      };
      const result = updateScheduleBlockSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject empty blockId', () => {
      const input = {
        ...validInput,
        blockId: '',
        scope: 'THIS_AND_FUTURE' as const,
      };
      const result = updateScheduleBlockSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject missing scope', () => {
      const input = { ...validInput, blockId: 'block-123' };
      const result = updateScheduleBlockSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject invalid scope', () => {
      const input = {
        ...validInput,
        blockId: 'block-123',
        scope: 'INVALID_SCOPE',
      };
      const result = updateScheduleBlockSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe('scheduleBlockRosterMutationSchema', () => {
    it('should accept valid roster mutation input', () => {
      const input = {
        blockId: 'block-123',
        clientId: 'client-456',
      };
      const result = scheduleBlockRosterMutationSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject empty blockId', () => {
      const input = {
        blockId: '',
        clientId: 'client-456',
      };
      const result = scheduleBlockRosterMutationSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject empty clientId', () => {
      const input = {
        blockId: 'block-123',
        clientId: '',
      };
      const result = scheduleBlockRosterMutationSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should trim whitespace', () => {
      const input = {
        blockId: '  block-123  ',
        clientId: '  client-456  ',
      };
      const result = scheduleBlockRosterMutationSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.blockId).toBe('block-123');
        expect(result.data.clientId).toBe('client-456');
      }
    });
  });

  describe('reassignScheduleBlockCoachSchema', () => {
    it('should accept valid coach reassignment input', () => {
      const input = {
        blockId: 'block-123',
        coachId: 'coach-456',
      };
      const result = reassignScheduleBlockCoachSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject empty blockId', () => {
      const input = {
        blockId: '',
        coachId: 'coach-456',
      };
      const result = reassignScheduleBlockCoachSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject empty coachId', () => {
      const input = {
        blockId: 'block-123',
        coachId: '',
      };
      const result = reassignScheduleBlockCoachSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe('scheduleBlockLifecycleSchema', () => {
    it('should accept valid lifecycle update with ACTIVE status', () => {
      const input = {
        blockId: 'block-123',
        nextStatus: ScheduleBlockStatus.ACTIVE,
      };
      const result = scheduleBlockLifecycleSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should accept valid lifecycle update with PAUSED status', () => {
      const input = {
        blockId: 'block-123',
        nextStatus: ScheduleBlockStatus.PAUSED,
      };
      const result = scheduleBlockLifecycleSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should accept valid lifecycle update with ARCHIVED status', () => {
      const input = {
        blockId: 'block-123',
        nextStatus: ScheduleBlockStatus.ARCHIVED,
      };
      const result = scheduleBlockLifecycleSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject empty blockId', () => {
      const input = {
        blockId: '',
        nextStatus: ScheduleBlockStatus.ACTIVE,
      };
      const result = scheduleBlockLifecycleSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject invalid status', () => {
      const input = {
        blockId: 'block-123',
        nextStatus: 'INVALID_STATUS',
      };
      const result = scheduleBlockLifecycleSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe('duplicateScheduleBlockSchema', () => {
    it('should accept valid duplicate input with date range', () => {
      const input = {
        blockId: 'block-123',
        startsOn: '2024-07-01',
        endsOn: '2024-07-31',
      };
      const result = duplicateScheduleBlockSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject empty blockId', () => {
      const input = {
        blockId: '',
        startsOn: '2024-07-01',
        endsOn: '2024-07-31',
      };
      const result = duplicateScheduleBlockSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject invalid startsOn format', () => {
      const input = {
        blockId: 'block-123',
        startsOn: '07/01/2024',
        endsOn: '2024-07-31',
      };
      const result = duplicateScheduleBlockSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject invalid endsOn format', () => {
      const input = {
        blockId: 'block-123',
        startsOn: '2024-07-01',
        endsOn: '31-07-2024',
      };
      const result = duplicateScheduleBlockSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should accept same date for startsOn and endsOn', () => {
      const input = {
        blockId: 'block-123',
        startsOn: '2024-07-01',
        endsOn: '2024-07-01',
      };
      const result = duplicateScheduleBlockSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });
});
