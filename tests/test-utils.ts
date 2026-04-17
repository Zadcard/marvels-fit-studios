import { vi } from 'vitest';
import type { PrismaClient } from '@prisma/client';

/**
 * Mock Prisma client for testing
 * Usage: const mockPrisma = createMockPrisma();
 */
export function createMockPrisma(): Partial<PrismaClient> {
  return {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    client: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    coach: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    trainingSession: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    sessionBooking: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    scheduleBlock: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    lead: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    subscription: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    clientSubscription: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };
}

/**
 * Mock getPrisma function for use in vi.mock
 */
export const mockGetPrisma = vi.fn(() => createMockPrisma());

/**
 * Create a test user object
 */
export function createTestUser(overrides?: Partial<any>) {
  return {
    id: 'test-user-1',
    email: 'test@example.com',
    password: 'hashed_password',
    role: 'CLIENT',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

/**
 * Create a test client object
 */
export function createTestClient(overrides?: Partial<any>) {
  return {
    id: 'client-1',
    userId: 'test-user-1',
    firstName: 'John',
    lastName: 'Doe',
    phoneNumber: '+1234567890',
    profileImage: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

/**
 * Create a test training session
 */
export function createTestTrainingSession(overrides?: Partial<any>) {
  return {
    id: 'session-1',
    coachId: 'coach-1',
    type: 'GROUP',
    status: 'SCHEDULED',
    capacity: 10,
    title: 'Strength Training',
    description: 'Full body strength workout',
    startTime: new Date('2024-06-01T10:00:00'),
    endTime: new Date('2024-06-01T11:00:00'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

/**
 * Create a test session booking
 */
export function createTestSessionBooking(overrides?: Partial<any>) {
  return {
    id: 'booking-1',
    trainingSessionId: 'session-1',
    clientId: 'client-1',
    status: 'BOOKED',
    source: 'MANUAL',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

/**
 * Assert that a function was called with expected arguments
 */
export function assertCalledWith(
  fn: any,
  expectedArgs: any[],
) {
  expect(fn).toHaveBeenCalledWith(...expectedArgs);
}

/**
 * Assert that a function was never called
 */
export function assertNotCalled(fn: any) {
  expect(fn).not.toHaveBeenCalled();
}
