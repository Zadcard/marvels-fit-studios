# Testing Guide - Marvel Fit Studios

## Overview

This project uses **Vitest** for unit and integration testing. Vitest is a modern, fast testing framework that works great with TypeScript and Next.js.

---

## Getting Started

### Installation
Dependencies are already installed. If not, run:
```bash
npm install -D vitest @vitest/ui @vitest/coverage-v8 happy-dom
```

### Configuration
- `vitest.config.ts` - Main configuration file
- Test files use the `.test.ts` or `.spec.ts` extension

---

## Running Tests

### Watch Mode (Recommended for Development)
```bash
npm run test
```
Tests re-run automatically when you save files. Great for development!

### One-Time Run
```bash
npm run test:run
```
Runs all tests once and exits.

### UI Dashboard
```bash
npm run test:ui
```
Opens a visual dashboard at `http://localhost:51204/__vitest__` to see test results.

### Coverage Report
```bash
npm run test:coverage
```
Generates a coverage report in `coverage/` directory. Open `coverage/index.html` in browser.

### Watch with Coverage
```bash
npm run test:watch
```
Continuous watch mode with coverage updates.

---

## Writing Tests

### Basic Test Structure

```typescript
import { describe, it, expect } from 'vitest';

describe('Feature Name', () => {
  it('should do something specific', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = doSomething(input);
    
    // Assert
    expect(result).toBe('expected');
  });
});
```

### Real Example: Authorization Policy
See `lib/auth/authorization-policy.test.ts` for a complete working example.

---

## Test Utilities & Helpers

Located in `tests/test-utils.ts`. These make testing easier:

### Mock Prisma Client
```typescript
import { createMockPrisma, mockGetPrisma } from '@/tests/test-utils';

vi.mock('@/lib/prisma', () => ({
  getPrisma: mockGetPrisma,
}));

it('should fetch user', async () => {
  const mockPrisma = createMockPrisma();
  const testUser = { id: '1', email: 'test@example.com' };
  
  mockPrisma.user.findUnique.mockResolvedValue(testUser);
  // Your test here
});
```

### Test Data Factories
```typescript
import {
  createTestUser,
  createTestClient,
  createTestTrainingSession,
  createTestSessionBooking,
} from '@/tests/test-utils';

it('should book a session', () => {
  const user = createTestUser({ email: 'john@example.com' });
  const client = createTestClient({ userId: user.id });
  const session = createTestTrainingSession();
  const booking = createTestSessionBooking({
    clientId: client.id,
    trainingSessionId: session.id,
  });
  
  // Your test here
});
```

---

## Common Testing Patterns

### Testing Pure Functions
```typescript
describe('Utility function', () => {
  it('should calculate correctly', () => {
    const result = calculatePrice(100, 0.1);
    expect(result).toBe(90);
  });
});
```

### Testing with Mocks
```typescript
import { vi } from 'vitest';

it('should call function once', async () => {
  const mockFn = vi.fn();
  mockFn('test');
  
  expect(mockFn).toHaveBeenCalledWith('test');
  expect(mockFn).toHaveBeenCalledTimes(1);
});
```

### Testing Async Functions
```typescript
it('should fetch data', async () => {
  const result = await fetchData();
  expect(result).toBeDefined();
});

it('should handle errors', async () => {
  await expect(fetchData()).rejects.toThrow();
});
```

### Testing Form Validation
```typescript
import { createSessionBookingSchema } from '@/lib/validators/session-booking';

it('should validate booking input', () => {
  const validInput = {
    trainingSessionId: 'session-1',
    clientId: 'client-1',
  };
  
  const result = createSessionBookingSchema.safeParse(validInput);
  expect(result.success).toBe(true);
});

it('should reject invalid booking input', () => {
  const invalidInput = {
    trainingSessionId: '', // Empty not allowed
    clientId: 'client-1',
  };
  
  const result = createSessionBookingSchema.safeParse(invalidInput);
  expect(result.success).toBe(false);
});
```

---

## Assertion Cheat Sheet

### Common Assertions
```typescript
// Equality
expect(value).toBe(expectedValue);          // Strict equality (===)
expect(value).toEqual(expectedValue);       // Deep equality
expect(value).toStrictEqual(expectedValue); // Strict deep equality

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeUndefined();
expect(value).toBeNull();
expect(value).toBeDefined();

// Numbers
expect(value).toBeGreaterThan(5);
expect(value).toBeGreaterThanOrEqual(5);
expect(value).toBeLessThan(5);
expect(value).toBeCloseTo(0.1 + 0.2); // For floating point

// Strings
expect(value).toMatch(/regex/);
expect(value).toContain('substring');
expect(value).toHaveLength(5);

// Arrays/Objects
expect(array).toContain(item);
expect(array).toHaveLength(3);
expect(object).toHaveProperty('prop');
expect(object).toHaveProperty('prop', value);

// Errors
expect(fn).toThrow();
expect(fn).toThrow(Error);
expect(fn).toThrow('message');

// Mocks
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledTimes(1);
expect(mockFn).toHaveBeenCalledWith(arg1, arg2);
expect(mockFn).toHaveBeenLastCalledWith(arg1);
expect(mockFn).toHaveReturnedWith(value);
```

---

## Test Organization

### File Structure
```
lib/
├── auth/
│   ├── authorization-policy.ts
│   └── authorization-policy.test.ts      ✓ Test next to source
├── services/
│   ├── session-booking-service.ts
│   └── session-booking-service.test.ts   ✓ Test next to source
└── ...

tests/
├── test-utils.ts                         ✓ Shared test utilities
├── analytics-event-catalog.test.mjs      ✓ Schema validation tests
└── dashboard-mini-stat-adoption.test.mjs ✓ Schema validation tests
```

### Naming Convention
- Test file: `feature.test.ts` or `feature.spec.ts`
- Test suite: `describe('FeatureName', () => { ... })`
- Test case: `it('should do something specific', () => { ... })`

---

## Mocking Strategies

### Mocking Modules
```typescript
import { vi } from 'vitest';

// Mock an entire module
vi.mock('@/lib/prisma', () => ({
  getPrisma: vi.fn(),
}));

// Mock specific export
import * as module from '@/lib/module';
vi.spyOn(module, 'function').mockReturnValue('mocked');
```

### Mocking HTTP Requests
```typescript
import { vi } from 'vitest';

// Mock fetch
global.fetch = vi.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ data: 'test' }),
  })
);
```

### Resetting Mocks
```typescript
import { afterEach } from 'vitest';

afterEach(() => {
  vi.clearAllMocks();  // Clear call history
  vi.resetAllMocks();  // Reset all mocks
});
```

---

## CI/CD Integration

### GitHub Actions
Tests run automatically on every push. See `.github/workflows/test.yml` (when created).

### Pre-commit Hook
To run tests before committing:
```bash
git hook add "pre-commit" "npm run test:run"
```

---

## Best Practices

### ✅ Do's
- Write one assertion per test or related assertions
- Use descriptive test names
- Keep tests focused and small
- Use test utilities for common setup
- Mock external dependencies
- Test both happy path and edge cases
- Keep tests DRY with helper functions

### ❌ Don'ts
- Don't test implementation details
- Don't write tests that depend on other tests
- Don't mock everything (test real logic when possible)
- Don't write overly complex tests
- Don't skip error cases
- Don't have hardcoded sleep/wait in tests

---

## Example Test Files

### Quick Win Tests to Start With

1. **Authorization Policy** (Already written)
   - Path: `lib/auth/authorization-policy.test.ts`
   - Count: 10 tests
   - Status: ✅ READY TO RUN

2. **Input Validators** (Next to write)
   - Path: `lib/validators/*.test.ts`
   - Count: ~20 tests
   - Focus: Session booking, training session, schedule block

3. **Password Verification** (Quick)
   - Path: `lib/auth/password-verifier.test.ts`
   - Count: 5 tests
   - Focus: Hash, verify, edge cases

4. **Session Booking Service** (Complex)
   - Path: `lib/services/session-booking-service.test.ts`
   - Count: 30+ tests
   - Focus: Booking creation, validation, cancellation

---

## Troubleshooting

### "Cannot find module" errors
- Make sure `vitest.config.ts` has the correct path alias
- Check that `@/` maps to project root in `tsconfig.json`

### Tests not running
- Check file extension is `.test.ts` or `.spec.ts`
- Verify vitest is installed: `npm list vitest`
- Try `npm run test:run` to see detailed error

### Mock not working
- Import `vi` from `vitest`: `import { vi } from 'vitest'`
- Mock must be called before importing the module
- Use `vi.clearAllMocks()` between tests

### Coverage looks low
- Check that config in `vitest.config.ts` excludes generated/mock files
- Focus on untested source files first

---

## Further Reading

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Patterns](https://testing-library.com/)
- [Jest/Vitest Matchers](https://vitest.dev/api/)

---

## Questions?

See `TEST_COVERAGE_ANALYSIS.md` for:
- What needs testing (priority areas)
- Test estimation and roadmap
- Test metrics and goals

---

**Last Updated:** 2026-04-17  
**Vitest Version:** 4.1.4
