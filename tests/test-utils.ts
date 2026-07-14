import { expect, vi, type Mock } from 'vitest';

/**
 * A mocked DataStore model delegate. Every method is a vitest Mock so tests can
 * chain `.mockResolvedValue(...)` etc. with full type safety.
 */
type MockModelDelegate = {
  findUnique: Mock;
  findFirst: Mock;
  findMany: Mock;
  create: Mock;
  update: Mock;
  delete: Mock;
  count: Mock;
  upsert: Mock;
};

/**
 * Shape of the object returned by {@link createMockDataStore}. Delegates are
 * non-optional (unlike `Partial<DataStoreClient>`) so `mockDataStore.sessionBooking`
 * is never `possibly undefined` in tests.
 */
export type MockDataStore = {
  user: MockModelDelegate;
  client: MockModelDelegate;
  coach: MockModelDelegate;
  trainingSession: MockModelDelegate;
  sessionBooking: MockModelDelegate;
  scheduleBlock: MockModelDelegate;
  lead: MockModelDelegate;
  subscription: MockModelDelegate;
  clientSubscription: MockModelDelegate;
  $transaction: Mock;
};

function createMockDelegate(): MockModelDelegate {
  return {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn().mockResolvedValue(0),
    upsert: vi.fn(),
  };
}

/**
 * Mock DataStore client for testing
 * Usage: const mockDataStore = createMockDataStore();
 */
export function createMockDataStore(): MockDataStore {
  return {
    user: createMockDelegate(),
    client: createMockDelegate(),
    coach: createMockDelegate(),
    trainingSession: createMockDelegate(),
    sessionBooking: createMockDelegate(),
    scheduleBlock: createMockDelegate(),
    lead: createMockDelegate(),
    subscription: createMockDelegate(),
    clientSubscription: createMockDelegate(),
    $transaction: vi.fn(),
  };
}

/**
 * Mock getDataStore function for use in vi.mock
 */
export const mockGetDataStore = vi.fn(() => createMockDataStore());

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
