// Mock must be first
import { mockGetPrisma, createMockPrisma } from '@/tests/test-utils';
import { vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  getPrisma: mockGetPrisma,
}));

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AdminClientRepository } from './admin-client-repository';

describe('AdminClientRepository', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let repository: AdminClientRepository;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    mockGetPrisma.mockReturnValue(mockPrisma);
    repository = new AdminClientRepository();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('list', () => {
    it('should fetch clients ordered by creation date descending', async () => {
      mockPrisma.client.findMany.mockResolvedValue([]);

      await repository.list();

      expect(mockPrisma.client.findMany).toHaveBeenCalledWith({
        orderBy: [{ createdAt: 'desc' }],
        select: expect.any(Object),
      });
    });

    it('should return empty array when no clients exist', async () => {
      mockPrisma.client.findMany.mockResolvedValue([]);

      const result = await repository.list();

      expect(result).toEqual([]);
    });

    it('should map single client to AdminClientRecord', async () => {
      mockPrisma.client.findMany.mockResolvedValue([
        {
          id: 'client-1',
          fullName: 'John Doe',
          phone: '+1234567890',
          paymentStatus: 'PAID',
          status: 'ACTIVE',
          createdAt: new Date('2024-01-01'),
          user: {
            email: 'john@example.com',
          },
          group: {
            id: 'group-1',
            name: 'Group A',
            coach: {
              fullName: 'Coach Smith',
            },
          },
          scheduleBlocks: [
            {
              scheduleBlock: {
                id: 'block-1',
                title: 'Monday Training',
              },
            },
          ],
          subscriptions: [
            {
              id: 'sub-1',
              status: 'ACTIVE',
              plan: {
                name: 'Group',
              },
              payments: [
                {
                  date: new Date('2024-06-01'),
                },
              ],
            },
          ],
          payments: [
            {
              amount: 500,
              date: new Date('2024-06-01'),
            },
          ],
          bookings: [
            {
              trainingSession: {
                startsAt: new Date('2024-06-15T10:00:00'),
                title: 'Monday Training',
                type: 'GROUP',
                coach: {
                  fullName: 'Coach Smith',
                },
              },
            },
          ],
        },
      ]);

      const result = await repository.list();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'client-1',
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        status: 'Active',
        paymentStatus: 'Paid',
      });
    });

    it('should handle client with no email', async () => {
      mockPrisma.client.findMany.mockResolvedValue([
        {
          id: 'client-1',
          fullName: 'John Doe',
          phone: '+1234567890',
          paymentStatus: 'PAID',
          status: 'ACTIVE',
          createdAt: new Date('2024-01-01'),
          user: {
            email: null,
          },
          group: null,
          scheduleBlocks: [],
          subscriptions: [],
          payments: [],
          bookings: [],
        },
      ]);

      const result = await repository.list();

      expect(result[0].email).toBe('No email');
    });

    it('should handle client with no phone', async () => {
      mockPrisma.client.findMany.mockResolvedValue([
        {
          id: 'client-1',
          fullName: 'John Doe',
          phone: null,
          paymentStatus: 'PAID',
          status: 'ACTIVE',
          createdAt: new Date('2024-01-01'),
          user: {
            email: 'john@example.com',
          },
          group: null,
          scheduleBlocks: [],
          subscriptions: [],
          payments: [],
          bookings: [],
        },
      ]);

      const result = await repository.list();

      expect(result[0].phone).toBe('No phone');
    });

    it('should map client status ACTIVE', async () => {
      mockPrisma.client.findMany.mockResolvedValue([
        {
          id: 'client-1',
          fullName: 'John Doe',
          phone: '+1234567890',
          paymentStatus: 'PAID',
          status: 'ACTIVE',
          createdAt: new Date('2024-01-01'),
          user: { email: 'john@example.com' },
          group: null,
          scheduleBlocks: [],
          subscriptions: [],
          payments: [],
          bookings: [],
        },
      ]);

      const result = await repository.list();

      expect(result[0].status).toBe('Active');
    });

    it('should map client status PAUSED', async () => {
      mockPrisma.client.findMany.mockResolvedValue([
        {
          id: 'client-1',
          fullName: 'John Doe',
          phone: '+1234567890',
          paymentStatus: 'PAID',
          status: 'PAUSED',
          createdAt: new Date('2024-01-01'),
          user: { email: 'john@example.com' },
          group: null,
          scheduleBlocks: [],
          subscriptions: [],
          payments: [],
          bookings: [],
        },
      ]);

      const result = await repository.list();

      expect(result[0].status).toBe('Paused');
    });

    it('should map client status PENDING', async () => {
      mockPrisma.client.findMany.mockResolvedValue([
        {
          id: 'client-1',
          fullName: 'John Doe',
          phone: '+1234567890',
          paymentStatus: 'PAID',
          status: 'PENDING',
          createdAt: new Date('2024-01-01'),
          user: { email: 'john@example.com' },
          group: null,
          scheduleBlocks: [],
          subscriptions: [],
          payments: [],
          bookings: [],
        },
      ]);

      const result = await repository.list();

      expect(result[0].status).toBe('Pending');
    });

    it('should infer membership as Group Membership for GROUP bookings only', async () => {
      mockPrisma.client.findMany.mockResolvedValue([
        {
          id: 'client-1',
          fullName: 'John Doe',
          phone: '+1234567890',
          paymentStatus: 'PAID',
          status: 'ACTIVE',
          createdAt: new Date('2024-01-01'),
          user: { email: 'john@example.com' },
          group: null,
          scheduleBlocks: [],
          subscriptions: [
            {
              id: 'sub-1',
              status: 'ACTIVE',
              plan: { name: 'Group' },
              payments: [],
            },
          ],
          payments: [],
          bookings: [
            {
              trainingSession: {
                startsAt: new Date('2024-06-15T10:00:00'),
                title: 'Group Training',
                type: 'GROUP',
                coach: { fullName: 'Coach Smith' },
              },
            },
          ],
        },
      ]);

      const result = await repository.list();

      expect(result[0].membership).toBe('Group Membership');
    });

    it('should infer membership as Private Coaching for PRIVATE bookings only', async () => {
      mockPrisma.client.findMany.mockResolvedValue([
        {
          id: 'client-1',
          fullName: 'John Doe',
          phone: '+1234567890',
          paymentStatus: 'PAID',
          status: 'ACTIVE',
          createdAt: new Date('2024-01-01'),
          user: { email: 'john@example.com' },
          group: null,
          scheduleBlocks: [],
          subscriptions: [
            {
              id: 'sub-1',
              status: 'ACTIVE',
              plan: { name: 'Private' },
              payments: [],
            },
          ],
          payments: [],
          bookings: [
            {
              trainingSession: {
                startsAt: new Date('2024-06-15T10:00:00'),
                title: 'Private Session',
                type: 'PRIVATE',
                coach: { fullName: 'Coach Smith' },
              },
            },
          ],
        },
      ]);

      const result = await repository.list();

      expect(result[0].membership).toBe('Private Coaching');
    });

    it('should infer membership as Hybrid for both GROUP and PRIVATE bookings', async () => {
      mockPrisma.client.findMany.mockResolvedValue([
        {
          id: 'client-1',
          fullName: 'John Doe',
          phone: '+1234567890',
          paymentStatus: 'PAID',
          status: 'ACTIVE',
          createdAt: new Date('2024-01-01'),
          user: { email: 'john@example.com' },
          group: null,
          scheduleBlocks: [],
          subscriptions: [
            {
              id: 'sub-1',
              status: 'ACTIVE',
              plan: { name: 'Hybrid' },
              payments: [],
            },
          ],
          payments: [],
          bookings: [
            {
              trainingSession: {
                startsAt: new Date('2024-06-15T10:00:00'),
                title: 'Group Training',
                type: 'GROUP',
                coach: { fullName: 'Coach Smith' },
              },
            },
            {
              trainingSession: {
                startsAt: new Date('2024-06-16T14:00:00'),
                title: 'Private Session',
                type: 'PRIVATE',
                coach: { fullName: 'Coach Jones' },
              },
            },
          ],
        },
      ]);

      const result = await repository.list();

      expect(result[0].membership).toBe('Hybrid');
    });

    it('should map payment status PAID', async () => {
      mockPrisma.client.findMany.mockResolvedValue([
        {
          id: 'client-1',
          fullName: 'John Doe',
          phone: '+1234567890',
          paymentStatus: 'PAID',
          status: 'ACTIVE',
          createdAt: new Date('2024-01-01'),
          user: { email: 'john@example.com' },
          group: null,
          scheduleBlocks: [],
          subscriptions: [],
          payments: [],
          bookings: [],
        },
      ]);

      const result = await repository.list();

      expect(result[0].paymentStatus).toBe('Paid');
    });

    it('should map payment status DUE_SOON', async () => {
      mockPrisma.client.findMany.mockResolvedValue([
        {
          id: 'client-1',
          fullName: 'John Doe',
          phone: '+1234567890',
          paymentStatus: 'DUE_SOON',
          status: 'ACTIVE',
          createdAt: new Date('2024-01-01'),
          user: { email: 'john@example.com' },
          group: null,
          scheduleBlocks: [],
          subscriptions: [],
          payments: [],
          bookings: [],
        },
      ]);

      const result = await repository.list();

      expect(result[0].paymentStatus).toBe('Due soon');
    });

    it('should handle multiple clients in list', async () => {
      mockPrisma.client.findMany.mockResolvedValue([
        {
          id: 'client-1',
          fullName: 'John Doe',
          phone: '+1111111111',
          paymentStatus: 'PAID',
          status: 'ACTIVE',
          createdAt: new Date('2024-01-02'),
          user: { email: 'john@example.com' },
          group: null,
          scheduleBlocks: [],
          subscriptions: [],
          payments: [],
          bookings: [],
        },
        {
          id: 'client-2',
          fullName: 'Jane Smith',
          phone: '+2222222222',
          paymentStatus: 'UNPAID',
          status: 'PAUSED',
          createdAt: new Date('2024-01-01'),
          user: { email: 'jane@example.com' },
          group: null,
          scheduleBlocks: [],
          subscriptions: [],
          payments: [],
          bookings: [],
        },
      ]);

      const result = await repository.list();

      expect(result).toHaveLength(2);
      expect(result[0].fullName).toBe('John Doe');
      expect(result[1].fullName).toBe('Jane Smith');
    });

    it('should use primary group coach as assigned coach when available', async () => {
      mockPrisma.client.findMany.mockResolvedValue([
        {
          id: 'client-1',
          fullName: 'John Doe',
          phone: '+1234567890',
          paymentStatus: 'PAID',
          status: 'ACTIVE',
          createdAt: new Date('2024-01-01'),
          user: { email: 'john@example.com' },
          group: {
            id: 'group-1',
            name: 'Group A',
            coach: {
              fullName: 'Coach Smith',
            },
          },
          scheduleBlocks: [],
          subscriptions: [],
          payments: [],
          bookings: [],
        },
      ]);

      const result = await repository.list();

      expect(result[0].assignedCoach).toBe('Coach Smith');
    });

    it('should use next booking coach when no primary group', async () => {
      mockPrisma.client.findMany.mockResolvedValue([
        {
          id: 'client-1',
          fullName: 'John Doe',
          phone: '+1234567890',
          paymentStatus: 'PAID',
          status: 'ACTIVE',
          createdAt: new Date('2024-01-01'),
          user: { email: 'john@example.com' },
          group: null,
          scheduleBlocks: [],
          subscriptions: [],
          payments: [],
          bookings: [
            {
              trainingSession: {
                startsAt: new Date('2024-06-15T10:00:00'),
                title: 'Training',
                type: 'GROUP',
                coach: {
                  fullName: 'Coach Jones',
                },
              },
            },
          ],
        },
      ]);

      const result = await repository.list();

      expect(result[0].assignedCoach).toBe('Coach Jones');
    });

    it('should default to Unassigned when no group or bookings', async () => {
      mockPrisma.client.findMany.mockResolvedValue([
        {
          id: 'client-1',
          fullName: 'John Doe',
          phone: '+1234567890',
          paymentStatus: 'PAID',
          status: 'ACTIVE',
          createdAt: new Date('2024-01-01'),
          user: { email: 'john@example.com' },
          group: null,
          scheduleBlocks: [],
          subscriptions: [],
          payments: [],
          bookings: [],
        },
      ]);

      const result = await repository.list();

      expect(result[0].assignedCoach).toBe('Unassigned');
    });

    it('should format joined date properly', async () => {
      mockPrisma.client.findMany.mockResolvedValue([
        {
          id: 'client-1',
          fullName: 'John Doe',
          phone: '+1234567890',
          paymentStatus: 'PAID',
          status: 'ACTIVE',
          createdAt: new Date('2024-06-15'),
          user: { email: 'john@example.com' },
          group: null,
          scheduleBlocks: [],
          subscriptions: [],
          payments: [],
          bookings: [],
        },
      ]);

      const result = await repository.list();

      expect(result[0].joinedDate).toContain('Jun');
      expect(result[0].joinedDate).toContain('15');
      expect(result[0].joinedDate).toContain('2024');
    });

    it('should handle null joined date', async () => {
      mockPrisma.client.findMany.mockResolvedValue([
        {
          id: 'client-1',
          fullName: 'John Doe',
          phone: '+1234567890',
          paymentStatus: 'PAID',
          status: 'ACTIVE',
          createdAt: null,
          user: { email: 'john@example.com' },
          group: null,
          scheduleBlocks: [],
          subscriptions: [],
          payments: [],
          bookings: [],
        },
      ]);

      const result = await repository.list();

      expect(result[0].joinedDate).toBe('TBD');
    });

    it('should fetch next 3 bookings in chronological order', async () => {
      mockPrisma.client.findMany.mockResolvedValue([]);

      await repository.list();

      const query = mockPrisma.client.findMany.mock.calls[0]?.[0];

      // Verify the select structure includes bookings with proper ordering
      expect(query).toBeDefined();
      if (query && 'select' in query) {
        const select = query.select as any;
        expect(select.bookings).toBeDefined();
        expect(select.bookings.take).toBe(3);
      }
    });

    it('should exclude canceled training sessions from bookings', async () => {
      mockPrisma.client.findMany.mockResolvedValue([
        {
          id: 'client-1',
          fullName: 'John Doe',
          phone: '+1234567890',
          paymentStatus: 'PAID',
          status: 'ACTIVE',
          createdAt: new Date('2024-01-01'),
          user: { email: 'john@example.com' },
          group: null,
          scheduleBlocks: [],
          subscriptions: [],
          payments: [],
          bookings: [
            {
              trainingSession: {
                startsAt: new Date('2024-06-15T10:00:00'),
                title: 'Next Session',
                type: 'GROUP',
                coach: { fullName: 'Coach Smith' },
              },
            },
          ],
        },
      ]);

      await repository.list();

      // Verify query excludes canceled sessions
      const query = mockPrisma.client.findMany.mock.calls[0]?.[0];
      expect(query).toBeDefined();
      if (query && 'select' in query) {
        const select = query.select as any;
        const bookingsWhere = select.bookings?.where;
        expect(bookingsWhere?.trainingSession?.status?.not).toBe('CANCELED');
      }
    });
  });
});
