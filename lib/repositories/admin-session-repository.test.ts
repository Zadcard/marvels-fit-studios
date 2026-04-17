// Mock must be first
import { mockGetPrisma, createMockPrisma } from '@/tests/test-utils';
import { vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  getPrisma: mockGetPrisma,
}));

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AdminSessionRepository } from './admin-session-repository';

describe('AdminSessionRepository', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let repository: AdminSessionRepository;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    mockGetPrisma.mockReturnValue(mockPrisma);
    repository = new AdminSessionRepository();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('list', () => {
    it('should fetch sessions, coaches, clients, and blocks in parallel', async () => {
      mockPrisma.trainingSession.findMany.mockResolvedValue([]);
      mockPrisma.coach.findMany.mockResolvedValue([]);
      mockPrisma.client.findMany.mockResolvedValue([]);
      mockPrisma.scheduleBlock.findMany.mockResolvedValue([]);

      await repository.list();

      expect(mockPrisma.trainingSession.findMany).toHaveBeenCalled();
      expect(mockPrisma.coach.findMany).toHaveBeenCalled();
      expect(mockPrisma.client.findMany).toHaveBeenCalled();
      expect(mockPrisma.scheduleBlock.findMany).toHaveBeenCalled();
    });

    it('should return empty arrays when no data exists', async () => {
      mockPrisma.trainingSession.findMany.mockResolvedValue([]);
      mockPrisma.coach.findMany.mockResolvedValue([]);
      mockPrisma.client.findMany.mockResolvedValue([]);
      mockPrisma.scheduleBlock.findMany.mockResolvedValue([]);

      const result = await repository.list();

      expect(result.groupRecords).toEqual([]);
      expect(result.privateRecords).toEqual([]);
      expect(result.editorRecords).toEqual([]);
      expect(result.coachOptions).toEqual([]);
      expect(result.clientOptions).toEqual([]);
      expect(result.blockOptions).toEqual([]);
    });

    it('should separate GROUP and PRIVATE sessions into different records', async () => {
      const now = new Date();
      mockPrisma.trainingSession.findMany.mockResolvedValue([
        {
          id: 'session-1',
          title: 'Group Training',
          description: 'Full body',
          startsAt: now,
          endsAt: new Date(now.getTime() + 3600000),
          location: 'Studio A',
          status: 'SCHEDULED',
          type: 'GROUP',
          capacity: 10,
          coachId: 'coach-1',
          groupId: 'group-1',
          scheduleBlockId: 'block-1',
          coach: { fullName: 'Coach Smith' },
          group: { name: 'Group A' },
          scheduleBlock: { title: 'Monday Training' },
          bookings: [
            {
              status: 'BOOKED',
              client: {
                id: 'client-1',
                fullName: 'John Doe',
              },
            },
          ],
          notes: [],
        },
        {
          id: 'session-2',
          title: 'Private Session',
          description: 'One-on-one',
          startsAt: now,
          endsAt: new Date(now.getTime() + 3600000),
          location: 'Studio B',
          status: 'SCHEDULED',
          type: 'PRIVATE',
          capacity: 1,
          coachId: 'coach-2',
          groupId: null,
          scheduleBlockId: null,
          coach: { fullName: 'Coach Jones' },
          group: null,
          scheduleBlock: null,
          bookings: [
            {
              status: 'BOOKED',
              client: {
                id: 'client-2',
                fullName: 'Jane Smith',
              },
            },
          ],
          notes: [
            {
              content: 'Focus on technique',
            },
          ],
        },
      ]);
      mockPrisma.coach.findMany.mockResolvedValue([]);
      mockPrisma.client.findMany.mockResolvedValue([]);
      mockPrisma.scheduleBlock.findMany.mockResolvedValue([]);

      const result = await repository.list();

      expect(result.groupRecords).toHaveLength(1);
      expect(result.privateRecords).toHaveLength(1);
      expect(result.editorRecords).toHaveLength(2);
    });

    it('should include capacity and enrolled count for GROUP sessions', async () => {
      const now = new Date();
      mockPrisma.trainingSession.findMany.mockResolvedValue([
        {
          id: 'session-1',
          title: 'Group Training',
          description: '',
          startsAt: now,
          endsAt: new Date(now.getTime() + 3600000),
          location: 'Studio A',
          status: 'SCHEDULED',
          type: 'GROUP',
          capacity: 10,
          coachId: 'coach-1',
          groupId: null,
          scheduleBlockId: null,
          coach: { fullName: 'Coach Smith' },
          group: null,
          scheduleBlock: null,
          bookings: [
            {
              status: 'BOOKED',
              client: { id: 'client-1', fullName: 'Client 1' },
            },
            {
              status: 'ATTENDED',
              client: { id: 'client-2', fullName: 'Client 2' },
            },
          ],
          notes: [],
        },
      ]);
      mockPrisma.coach.findMany.mockResolvedValue([]);
      mockPrisma.client.findMany.mockResolvedValue([]);
      mockPrisma.scheduleBlock.findMany.mockResolvedValue([]);

      const result = await repository.list();

      expect(result.groupRecords[0]).toMatchObject({
        capacity: 10,
        enrolled: 2,
      });
    });

    it('should mark GROUP session as Waitlist when at capacity', async () => {
      const now = new Date();
      mockPrisma.trainingSession.findMany.mockResolvedValue([
        {
          id: 'session-1',
          title: 'Group Training',
          description: '',
          startsAt: now,
          endsAt: new Date(now.getTime() + 3600000),
          location: 'Studio A',
          status: 'SCHEDULED',
          type: 'GROUP',
          capacity: 2,
          coachId: 'coach-1',
          groupId: null,
          scheduleBlockId: null,
          coach: { fullName: 'Coach Smith' },
          group: null,
          scheduleBlock: null,
          bookings: [
            {
              status: 'BOOKED',
              client: { id: 'client-1', fullName: 'Client 1' },
            },
            {
              status: 'BOOKED',
              client: { id: 'client-2', fullName: 'Client 2' },
            },
          ],
          notes: [],
        },
      ]);
      mockPrisma.coach.findMany.mockResolvedValue([]);
      mockPrisma.client.findMany.mockResolvedValue([]);
      mockPrisma.scheduleBlock.findMany.mockResolvedValue([]);

      const result = await repository.list();

      expect(result.groupRecords[0].status).toBe('Waitlist');
    });

    it('should include client name for PRIVATE sessions', async () => {
      const now = new Date();
      mockPrisma.trainingSession.findMany.mockResolvedValue([
        {
          id: 'session-1',
          title: 'Private Session',
          description: '',
          startsAt: now,
          endsAt: new Date(now.getTime() + 3600000),
          location: 'Studio A',
          status: 'SCHEDULED',
          type: 'PRIVATE',
          capacity: 1,
          coachId: 'coach-1',
          groupId: null,
          scheduleBlockId: null,
          coach: { fullName: 'Coach Smith' },
          group: null,
          scheduleBlock: null,
          bookings: [
            {
              status: 'BOOKED',
              client: { id: 'client-1', fullName: 'John Doe' },
            },
          ],
          notes: [
            {
              content: 'Focus area',
            },
          ],
        },
      ]);
      mockPrisma.coach.findMany.mockResolvedValue([]);
      mockPrisma.client.findMany.mockResolvedValue([]);
      mockPrisma.scheduleBlock.findMany.mockResolvedValue([]);

      const result = await repository.list();

      expect(result.privateRecords[0]).toMatchObject({
        clientName: 'John Doe',
        focus: 'Focus area',
      });
    });

    it('should set Unassigned client for PRIVATE session with no booking', async () => {
      const now = new Date();
      mockPrisma.trainingSession.findMany.mockResolvedValue([
        {
          id: 'session-1',
          title: 'Private Session',
          description: '',
          startsAt: now,
          endsAt: new Date(now.getTime() + 3600000),
          location: 'Studio A',
          status: 'SCHEDULED',
          type: 'PRIVATE',
          capacity: 1,
          coachId: 'coach-1',
          groupId: null,
          scheduleBlockId: null,
          coach: { fullName: 'Coach Smith' },
          group: null,
          scheduleBlock: null,
          bookings: [],
          notes: [],
        },
      ]);
      mockPrisma.coach.findMany.mockResolvedValue([]);
      mockPrisma.client.findMany.mockResolvedValue([]);
      mockPrisma.scheduleBlock.findMany.mockResolvedValue([]);

      const result = await repository.list();

      expect(result.privateRecords[0].clientName).toBe('Unassigned');
    });

    it('should set default focus for PRIVATE session with no notes', async () => {
      const now = new Date();
      mockPrisma.trainingSession.findMany.mockResolvedValue([
        {
          id: 'session-1',
          title: 'Private Session',
          description: '',
          startsAt: now,
          endsAt: new Date(now.getTime() + 3600000),
          location: 'Studio A',
          status: 'SCHEDULED',
          type: 'PRIVATE',
          capacity: 1,
          coachId: 'coach-1',
          groupId: null,
          scheduleBlockId: null,
          coach: { fullName: 'Coach Smith' },
          group: null,
          scheduleBlock: null,
          bookings: [],
          notes: [],
        },
      ]);
      mockPrisma.coach.findMany.mockResolvedValue([]);
      mockPrisma.client.findMany.mockResolvedValue([]);
      mockPrisma.scheduleBlock.findMany.mockResolvedValue([]);

      const result = await repository.list();

      expect(result.privateRecords[0].focus).toBe('Private coaching block');
    });

    it('should map session status CANCELED', async () => {
      const now = new Date();
      mockPrisma.trainingSession.findMany.mockResolvedValue([
        {
          id: 'session-1',
          title: 'Canceled Session',
          description: '',
          startsAt: now,
          endsAt: new Date(now.getTime() + 3600000),
          location: 'Studio A',
          status: 'CANCELED',
          type: 'GROUP',
          capacity: 10,
          coachId: 'coach-1',
          groupId: null,
          scheduleBlockId: null,
          coach: { fullName: 'Coach Smith' },
          group: null,
          scheduleBlock: null,
          bookings: [],
          notes: [],
        },
      ]);
      mockPrisma.coach.findMany.mockResolvedValue([]);
      mockPrisma.client.findMany.mockResolvedValue([]);
      mockPrisma.scheduleBlock.findMany.mockResolvedValue([]);

      const result = await repository.list();

      expect(result.groupRecords[0].status).toBe('Canceled');
    });

    it('should map session status DRAFT', async () => {
      const now = new Date();
      mockPrisma.trainingSession.findMany.mockResolvedValue([
        {
          id: 'session-1',
          title: 'Draft Session',
          description: '',
          startsAt: now,
          endsAt: new Date(now.getTime() + 3600000),
          location: 'Studio A',
          status: 'DRAFT',
          type: 'GROUP',
          capacity: 10,
          coachId: 'coach-1',
          groupId: null,
          scheduleBlockId: null,
          coach: { fullName: 'Coach Smith' },
          group: null,
          scheduleBlock: null,
          bookings: [],
          notes: [],
        },
      ]);
      mockPrisma.coach.findMany.mockResolvedValue([]);
      mockPrisma.client.findMany.mockResolvedValue([]);
      mockPrisma.scheduleBlock.findMany.mockResolvedValue([]);

      const result = await repository.list();

      expect(result.groupRecords[0].status).toBe('Draft');
    });

    it('should map session status COMPLETED', async () => {
      const now = new Date();
      mockPrisma.trainingSession.findMany.mockResolvedValue([
        {
          id: 'session-1',
          title: 'Completed Session',
          description: '',
          startsAt: now,
          endsAt: new Date(now.getTime() + 3600000),
          location: 'Studio A',
          status: 'COMPLETED',
          type: 'GROUP',
          capacity: 10,
          coachId: 'coach-1',
          groupId: null,
          scheduleBlockId: null,
          coach: { fullName: 'Coach Smith' },
          group: null,
          scheduleBlock: null,
          bookings: [],
          notes: [],
        },
      ]);
      mockPrisma.coach.findMany.mockResolvedValue([]);
      mockPrisma.client.findMany.mockResolvedValue([]);
      mockPrisma.scheduleBlock.findMany.mockResolvedValue([]);

      const result = await repository.list();

      expect(result.groupRecords[0].status).toBe('Completed');
    });

    it('should filter out CANCELED booking statuses', async () => {
      const now = new Date();
      mockPrisma.trainingSession.findMany.mockResolvedValue([
        {
          id: 'session-1',
          title: 'Session',
          description: '',
          startsAt: now,
          endsAt: new Date(now.getTime() + 3600000),
          location: 'Studio A',
          status: 'SCHEDULED',
          type: 'GROUP',
          capacity: 10,
          coachId: 'coach-1',
          groupId: null,
          scheduleBlockId: null,
          coach: { fullName: 'Coach Smith' },
          group: null,
          scheduleBlock: null,
          bookings: [
            {
              status: 'BOOKED',
              client: { id: 'client-1', fullName: 'Client 1' },
            },
            {
              status: 'CANCELED',
              client: { id: 'client-2', fullName: 'Client 2' },
            },
          ],
          notes: [],
        },
      ]);
      mockPrisma.coach.findMany.mockResolvedValue([]);
      mockPrisma.client.findMany.mockResolvedValue([]);
      mockPrisma.scheduleBlock.findMany.mockResolvedValue([]);

      const result = await repository.list();

      expect(result.editorRecords[0].bookedClients).toHaveLength(1);
      expect(result.editorRecords[0].bookedClients[0].fullName).toBe('Client 1');
    });

    it('should return coach options sorted alphabetically', async () => {
      mockPrisma.trainingSession.findMany.mockResolvedValue([]);
      mockPrisma.coach.findMany.mockResolvedValue([
        { id: 'coach-1', fullName: 'Smith' },
        { id: 'coach-2', fullName: 'Jones' },
        { id: 'coach-3', fullName: 'Brown' },
      ]);
      mockPrisma.client.findMany.mockResolvedValue([]);
      mockPrisma.scheduleBlock.findMany.mockResolvedValue([]);

      const result = await repository.list();

      expect(result.coachOptions).toHaveLength(3);
      expect(result.coachOptions[0].fullName).toBe('Smith');
    });

    it('should return client options sorted alphabetically', async () => {
      mockPrisma.trainingSession.findMany.mockResolvedValue([]);
      mockPrisma.coach.findMany.mockResolvedValue([]);
      mockPrisma.client.findMany.mockResolvedValue([
        { id: 'client-1', fullName: 'Zoe' },
        { id: 'client-2', fullName: 'Alice' },
      ]);
      mockPrisma.scheduleBlock.findMany.mockResolvedValue([]);

      const result = await repository.list();

      expect(result.clientOptions).toHaveLength(2);
    });

    it('should return block options sorted alphabetically', async () => {
      mockPrisma.trainingSession.findMany.mockResolvedValue([]);
      mockPrisma.coach.findMany.mockResolvedValue([]);
      mockPrisma.client.findMany.mockResolvedValue([]);
      mockPrisma.scheduleBlock.findMany.mockResolvedValue([
        { id: 'block-1', title: 'Wednesday' },
        { id: 'block-2', title: 'Monday' },
      ]);

      const result = await repository.list();

      expect(result.blockOptions).toHaveLength(2);
    });

    it('should handle session with null location', async () => {
      const now = new Date();
      mockPrisma.trainingSession.findMany.mockResolvedValue([
        {
          id: 'session-1',
          title: 'Session',
          description: '',
          startsAt: now,
          endsAt: new Date(now.getTime() + 3600000),
          location: null,
          status: 'SCHEDULED',
          type: 'GROUP',
          capacity: 10,
          coachId: 'coach-1',
          groupId: null,
          scheduleBlockId: null,
          coach: { fullName: 'Coach Smith' },
          group: null,
          scheduleBlock: null,
          bookings: [],
          notes: [],
        },
      ]);
      mockPrisma.coach.findMany.mockResolvedValue([]);
      mockPrisma.client.findMany.mockResolvedValue([]);
      mockPrisma.scheduleBlock.findMany.mockResolvedValue([]);

      const result = await repository.list();

      expect(result.groupRecords[0].location).toBe('Studio floor');
    });

    it('should fetch sessions ordered by start time ascending', async () => {
      mockPrisma.trainingSession.findMany.mockResolvedValue([]);
      mockPrisma.coach.findMany.mockResolvedValue([]);
      mockPrisma.client.findMany.mockResolvedValue([]);
      mockPrisma.scheduleBlock.findMany.mockResolvedValue([]);

      await repository.list();

      expect(mockPrisma.trainingSession.findMany).toHaveBeenCalledWith({
        orderBy: [{ startsAt: 'asc' }],
        select: expect.any(Object),
      });
    });

    it('should handle null capacity for GROUP session', async () => {
      const now = new Date();
      mockPrisma.trainingSession.findMany.mockResolvedValue([
        {
          id: 'session-1',
          title: 'Session',
          description: '',
          startsAt: now,
          endsAt: new Date(now.getTime() + 3600000),
          location: 'Studio A',
          status: 'SCHEDULED',
          type: 'GROUP',
          capacity: null,
          coachId: 'coach-1',
          groupId: null,
          scheduleBlockId: null,
          coach: { fullName: 'Coach Smith' },
          group: null,
          scheduleBlock: null,
          bookings: [
            {
              status: 'BOOKED',
              client: { id: 'client-1', fullName: 'Client 1' },
            },
          ],
          notes: [],
        },
      ]);
      mockPrisma.coach.findMany.mockResolvedValue([]);
      mockPrisma.client.findMany.mockResolvedValue([]);
      mockPrisma.scheduleBlock.findMany.mockResolvedValue([]);

      const result = await repository.list();

      // With null capacity, should use max(enrolled, 1)
      expect(result.groupRecords[0].capacity).toBe(1);
    });
  });
});
