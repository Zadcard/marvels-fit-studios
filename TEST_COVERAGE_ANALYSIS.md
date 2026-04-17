# Test Coverage Analysis - Marvel Fit Studios

**Date:** April 17, 2026  
**Current Test Coverage:** Minimal (2 schema validation tests only)

## Executive Summary

The codebase currently has **2 test files** (only schema validators) out of **65 library files**, **57 app/route files**, and **55 components**. This represents roughly **2-3% test coverage**. The project has critical business logic in services, repositories, and auth layers that are completely untested.

## Current Testing Status

### What's Being Tested ✅
- **analytics-event-catalog.test.mjs** - Validates analytics event schema format and PII compliance
- **dashboard-mini-stat-adoption.test.mjs** - Validates component adoption patterns and markup structure

### What's NOT Being Tested ❌
- Authentication & authorization logic
- Database operations (repositories)
- Business logic services
- Input validation schemas
- API routes and endpoints
- Component rendering
- Data transformation logic
- Complex workflows

---

## Critical Areas Needing Test Coverage

### 1. **Authentication & Authorization (HIGH PRIORITY)**
**Files to test:**
- `lib/auth/authorization-policy.ts` - Route authorization and role-based access control
- `lib/auth/credentials-auth-service.ts` - Credential-based authentication
- `lib/auth/password-verifier.ts` - Password verification logic
- `lib/auth/user-repository.ts` - User data access
- `lib/auth/session.ts` - Session management

**Why critical:**
- Handles security boundaries and access control
- Unauthorized access could expose sensitive data
- Session management affects user experience

**Test scenarios:**
```
✓ Policy matching for different route paths
✓ Role-based authorization for different user types
✓ Password verification (correct/incorrect passwords)
✓ Password hashing and verification
✓ User lookup and authentication
✓ Session creation and validation
✓ Edge cases (empty credentials, invalid users)
```

---

### 2. **Business Logic Services (HIGH PRIORITY)**
**Files to test:**
- `lib/services/session-booking-service.ts` - Booking creation, cancellation, validation
- `lib/services/training-session-service.ts` - Training session lifecycle
- `lib/services/schedule-block-service.ts` - Recurring schedule management
- `lib/services/attendance-service.ts` - Attendance tracking

**Why critical:**
- Core business operations depend on these
- Complex state transitions and edge cases
- Financial implications (bookings, payments)
- Data integrity constraints

**Test scenarios:**
```
✓ Create booking (valid session, available capacity)
✓ Booking validation (full sessions, invalid clients)
✓ Cancel booking (refund logic, state transitions)
✓ Waitlist management when capacity exceeded
✓ Session type handling (GROUP vs PRIVATE)
✓ Schedule block recurrence expansion
✓ Attendance marking (BOOKED → ATTENDED/MISSED)
✓ Edge cases (double-booking, invalid states)
```

---

### 3. **Input Validation & Schemas (MEDIUM PRIORITY)**
**Files to test:**
- `lib/validators/session-booking.ts` - Booking input validation
- `lib/validators/training-session.ts` - Session input validation
- `lib/validators/schedule-block.ts` - Schedule block validation

**Why important:**
- First line of defense against invalid data
- Ensures API contracts are enforced
- Prevents downstream errors

**Test scenarios:**
```
✓ Required field validation
✓ String trimming and normalization
✓ Enum value validation
✓ Edge cases (empty strings, whitespace)
✓ Type coercion
```

---

### 4. **Data Access Layer - Repositories (MEDIUM PRIORITY)**
**Files to test (21 total):**
- Admin repositories (clients, coaches, leads, sessions, subscriptions, etc.)
- Coach repositories (clients, sessions, settings)
- Client repositories (dashboard, settings)

**Why important:**
- Data consistency and accuracy
- Query correctness affects UI and reports
- Database constraints enforcement

**Test scenarios (per repository):**
```
✓ Fetch operations with filters
✓ Create operations with default values
✓ Update operations and state transitions
✓ Delete/archive operations
✓ Complex queries with joins
✓ Pagination and sorting
✓ Edge cases (no records, invalid IDs)
```

---

### 5. **Component Rendering & Interaction (MEDIUM PRIORITY)**
**High-value components to test:**
- Dashboard workspaces (admin, coach, client)
- Forms (session booking, client settings)
- Data display components (tables, lists)
- State management components

**Why important:**
- User-facing functionality
- Accessibility compliance
- Visual regressions
- Event handling

**Test scenarios:**
```
✓ Component mounting and rendering
✓ Props handling and edge cases
✓ Form submission and validation display
✓ Error state display
✓ Empty state display
✓ User interactions (clicks, form input)
✓ Accessibility (ARIA labels, focus management)
```

---

### 6. **API Routes (MEDIUM PRIORITY)**
**Current coverage:**
- Only `/api/auth/[...nextauth]/route.ts` exists

**Why important:**
- API contracts with frontend
- Request/response validation
- Error handling

**Test scenarios:**
```
✓ Happy path requests
✓ Invalid input handling
✓ Authentication requirements
✓ Authorization checks
✓ HTTP status codes
✓ Error responses
```

---

### 7. **Utility Functions & Helpers (LOW PRIORITY)**
**Files to test:**
- `lib/utils.ts` - General utilities
- `lib/custom-price-compat.ts` - Price compatibility logic
- `lib/services/schedule-block-utils.ts` - Schedule utilities
- `lib/navigation/dashboard-nav.ts` - Navigation configuration

**Why important:**
- Logic reused across the app
- Data transformation correctness

---

## Recommended Testing Strategy

### Phase 1: Foundation (Weeks 1-2)
**Setup & Authentication**
1. Install and configure a testing framework
   - Consider: **Vitest** (fastest, ESM-native, good for Node.js)
   - Or: **Jest** (more mature ecosystem)
   - Or: **Playwright** (already in dependencies, for E2E)

2. Set up test infrastructure
   - Test utilities and helpers
   - Mock Prisma client
   - Test database or in-memory alternatives

3. Write authentication tests (~30 tests)
   - Authorization policy tests
   - Password verification tests
   - Session management tests

**Estimated: 20-25 tests, ~3-4 hours**

---

### Phase 2: Critical Business Logic (Weeks 2-4)
**Services & Validators**
1. Session booking service tests (~50 tests)
2. Input validation schema tests (~20 tests)
3. Training session service tests (~20 tests)
4. Schedule block service tests (~30 tests)

**Estimated: 120+ tests, ~15-20 hours**

---

### Phase 3: Data Access Layer (Weeks 4-6)
**Repositories**
1. Focus on high-transaction repositories first
   - Admin client repository
   - Admin session repository
   - Session booking queries

2. Create repository test patterns
3. Test data factory/fixtures

**Estimated: 100+ tests, ~20-25 hours**

---

### Phase 4: UI & Integration (Weeks 6-8)
**Components & E2E**
1. Critical dashboard components
2. Forms and user interactions
3. E2E workflows using Playwright

**Estimated: 50+ tests, ~15-20 hours**

---

## Recommended Testing Framework

### Framework Choice: **Vitest**

**Why Vitest:**
- ✅ Modern, fast, ESM-native
- ✅ Compatible with TypeScript out of the box
- ✅ Jest-like API (familiar syntax)
- ✅ Better performance (faster tests)
- ✅ Better IDE integration
- ✅ Good for unit and integration tests

**Alternative: Playwright** (already installed)
- ✅ Great for E2E and component testing
- ✅ Already in dependencies
- ✅ Good for testing actual browser interactions
- Use in combination with Vitest

---

## Quick Wins (High ROI Tests)

Start with these ~10 tests for immediate value:

1. **Authorization policy tests** (3 tests)
   ```
   ✓ getAuthorizationPolicy returns correct policy for each route
   ✓ Admin routes require ADMIN role
   ✓ Public routes don't require auth
   ```

2. **Password verifier tests** (2 tests)
   ```
   ✓ Correct password verifies successfully
   ✓ Wrong password fails verification
   ```

3. **Booking validation tests** (3 tests)
   ```
   ✓ Valid booking passes schema
   ✓ Missing required fields fail
   ✓ Empty strings are trimmed
   ```

4. **Session booking service tests** (2 tests)
   ```
   ✓ Create booking increments capacity count
   ✓ Double-booking is prevented
   ```

---

## Test Metrics & Goals

### Current State
- **Test Files:** 2
- **Test Cases:** ~100 (mostly static assertions)
- **Code Coverage:** ~2-3%
- **Execution Time:** <1s

### 3-Month Goal
- **Test Files:** 20+
- **Test Cases:** 500+
- **Code Coverage:** 60-70% (critical paths)
- **Execution Time:** <10s

### Success Metrics
1. All authentication flows covered
2. All business logic edge cases tested
3. CI/CD integration with test gate
4. Zero critical bugs in tested code
5. Test reports in CI/CD pipeline

---

## Tools & Setup Checklist

- [ ] Choose testing framework (recommend Vitest)
- [ ] Configure test runner in package.json
- [ ] Create test utilities and helpers
- [ ] Set up Prisma mock/test database
- [ ] Create test data factories
- [ ] Add test scripts to CI/CD
- [ ] Configure coverage reporting
- [ ] Document testing best practices
- [ ] Set up pre-commit hooks for tests

---

## Risk Mitigation

**Without testing:**
- ❌ Regression bugs in critical paths
- ❌ Authorization vulnerabilities
- ❌ Data integrity issues
- ❌ Silent failures in bookings/payments
- ❌ Difficult refactoring and upgrades

**With comprehensive testing:**
- ✅ Fast feedback during development
- ✅ Safe refactoring
- ✅ Confidence in deployments
- ✅ Better code quality
- ✅ Documentation through tests

---

## Next Steps

1. **Choose testing framework** - Recommend Vitest setup
2. **Create test infrastructure** - Mock database, utilities
3. **Start with auth tests** - Foundation for other tests
4. **Add to CI/CD** - Automatic test execution
5. **Establish coverage baseline** - Track progress
6. **Document patterns** - Create testing guide for team

