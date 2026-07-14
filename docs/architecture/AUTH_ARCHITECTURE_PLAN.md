# ID-Based Authentication Architecture Plan

## Overview
Migrate from email-based to ID-based authentication with auto-generated credentials.

**ID Format:** `YYMMXXX` (Year + Month + Client Number)  
**Password Format:** `MFS_YYMMXXX`  
**Example:** Client #20 joined May 2026 → ID: `2605020`, Password: `MFS_2605020`

---

## Phase 1: Database Schema Changes

### 1.1 legacy ORM Schema Updates

**File:** `legacy ORM/schema.legacy ORM`

```legacy ORM
model User {
  id                    String      @id @default(cuid())
  
  // ===== NEW: ID-based auth =====
  clientId              String?     @unique  // Format: YYMMXXX
  
  // ===== LEGACY: Email auth (optional, for migration) =====
  email                 String?     @unique // Now optional
  
  // ===== Common fields =====
  password              String      // Hash of MFS_YYMMXXX
  role                  UserRole
  
  // Client-specific
  client                Client?
  
  // Auth fields
  createdAt             DateTime    @default(now())
  updatedAt             DateTime    @updatedAt
  lastLoginAt           DateTime?
  passwordResetToken    String?     @unique
  passwordResetExpires  DateTime?
  
  @@index([clientId])
  @@index([email])
}

model Client {
  id                    String      @id @default(cuid())
  userId                String      @unique
  user                  User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Client info
  fullName              String
  phone                 String?     @unique
  profileImage          String?
  
  // Status
  status                String      @default("ACTIVE") // ACTIVE, PAUSED, INACTIVE
  paymentStatus         String      @default("UNPAID")
  
  // Relationships
  groupId               String?
  group                 Group?      @relation(fields: [groupId], references: [id])
  
  subscriptions         ClientSubscription[]
  bookings              SessionBooking[]
  scheduleBlocks        ClientScheduleBlockAssignment[]
  payments              Payment[]
  
  createdAt             DateTime    @default(now())
  updatedAt             DateTime    @updatedAt
  
  @@index([userId])
  @@index([phone])
}
```

### 1.2 Migration Strategy

**Option A: Non-Breaking (Both systems coexist)**
- Keep existing email users functional
- New registrations use ID-based auth
- Email field becomes optional
- Migration path for existing users (opt-in)

**Option B: Full Migration (Clean break)**
- All users → ID-based system
- Generate IDs for existing users
- Disable email login after date X
- Provide migration notice

**Recommended:** Option A (safer, allows gradual transition)

---

## Phase 2: Core Services

### 2.1 ID Generation Service

**File:** `lib/services/client-id-generator.ts`

```typescript
export interface ClientIdGeneratorOptions {
  year?: number;        // Default: current year
  month?: number;       // Default: current month  
  clientNumber?: number; // Next available number
}

export class ClientIdGenerator {
  /**
   * Generate ID in format YYMMXXX
   * Example: 2605020 = May 2026, Client #20
   */
  generateId(options?: ClientIdGeneratorOptions): string {
    const now = new Date();
    const year = (options?.year || now.getFullYear()).toString().slice(-2);
    const month = String(options?.month || (now.getMonth() + 1)).padStart(2, '0');
    const clientNum = String(options?.clientNumber || 1).padStart(3, '0');
    
    return `${year}${month}${clientNum}`;
  }

  /**
   * Parse ID to get components
   * Example: "2605020" → { year: 2026, month: 5, clientNumber: 20 }
   */
  parseId(clientId: string): {
    year: number;
    month: number;
    clientNumber: number;
    joinDate: Date;
  } {
    if (!/^\d{7}$/.test(clientId)) {
      throw new Error('Invalid client ID format');
    }

    const year = 2000 + parseInt(clientId.slice(0, 2));
    const month = parseInt(clientId.slice(2, 4));
    const clientNumber = parseInt(clientId.slice(4, 7));

    if (month < 1 || month > 12) {
      throw new Error('Invalid month in client ID');
    }

    return {
      year,
      month,
      clientNumber,
      joinDate: new Date(year, month - 1, 1),
    };
  }

  /**
   * Get next available number for current month
   */
  async getNextClientNumber(legacy ORM: legacy data client): Promise<number> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const latestClient = await legacy ORM.user.findFirst({
      where: {
        clientId: {
          startsWith: `${year.toString().slice(-2)}${String(month).padStart(2, '0')}`,
        },
      },
      orderBy: { clientId: 'desc' },
      select: { clientId: true },
    });

    if (!latestClient?.clientId) {
      return 1;
    }

    const currentNumber = parseInt(latestClient.clientId.slice(4, 7));
    return currentNumber + 1;
  }
}

export const clientIdGenerator = new ClientIdGenerator();
```

### 2.2 Password Generation Service

**File:** `lib/services/password-generator.ts`

```typescript
export class PasswordGenerator {
  /**
   * Generate password in format: MFS_YYMMXXX
   */
  generatePassword(clientId: string): string {
    if (!/^\d{7}$/.test(clientId)) {
      throw new Error('Invalid client ID format');
    }
    return `MFS_${clientId}`;
  }

  /**
   * Validate password format
   */
  isValidFormat(password: string): boolean {
    return /^MFS_\d{7}$/.test(password);
  }

  /**
   * Extract client ID from password
   */
  extractClientId(password: string): string | null {
    const match = password.match(/^MFS_(\d{7})$/);
    return match?.[1] ?? null;
  }
}

export const passwordGenerator = new PasswordGenerator();
```

### 2.3 Client Registration Service

**File:** `lib/services/client-registration-service.ts`

```typescript
import { BcryptPasswordVerifier } from '@/lib/auth/password-verifier';
import bcryptjs from 'bcryptjs';

export interface RegisterClientInput {
  fullName: string;
  phone: string;
  // Email optional (for backward compatibility)
  email?: string;
}

export class ClientRegistrationService {
  private legacy ORM = getlegacy ORM();
  private passwordVerifier = new BcryptPasswordVerifier();

  async registerClient(input: RegisterClientInput): Promise<{
    userId: string;
    clientId: string;
    temporaryPassword: string;
  }> {
    const nextNumber = await clientIdGenerator.getNextClientNumber(this.legacy ORM);
    const clientId = clientIdGenerator.generateId({ clientNumber: nextNumber });
    const temporaryPassword = passwordGenerator.generatePassword(clientId);

    // Hash password
    const hashedPassword = await bcryptjs.hash(temporaryPassword, 10);

    // Create user with client in transaction
    const result = await this.legacy ORM.$transaction(async (tx) => {
      // Create User
      const user = await tx.user.create({
        data: {
          clientId,
          email: input.email || null,
          password: hashedPassword,
          role: 'CLIENT',
        },
        select: { id: true },
      });

      // Create Client
      const client = await tx.client.create({
        data: {
          userId: user.id,
          fullName: input.fullName,
          phone: input.phone,
          status: 'ACTIVE',
        },
        select: { id: true },
      });

      return { userId: user.id, clientId };
    });

    return {
      userId: result.userId,
      clientId: result.clientId,
      temporaryPassword,
    };
  }

  /**
   * Validate phone number uniqueness
   */
  async isPhoneAvailable(phone: string): Promise<boolean> {
    const existing = await this.legacy ORM.client.findUnique({
      where: { phone },
    });
    return !existing;
  }
}

export const clientRegistrationService = new ClientRegistrationService();
```

---

## Phase 3: Authentication Updates

### 3.1 Auth Service Refactor

**File:** `lib/auth/id-password-auth-service.ts`

```typescript
export interface LoginInput {
  clientId: string;
  password: string;
}

export class IdPasswordAuthService {
  private legacy ORM = getlegacy ORM();
  private passwordVerifier = new BcryptPasswordVerifier();

  /**
   * Authenticate user with client ID and password
   */
  async authenticate(input: LoginInput): Promise<{
    userId: string;
    clientId: string;
    role: UserRole;
  }> {
    // Find user by clientId
    const user = await this.legacy ORM.user.findUnique({
      where: { clientId: input.clientId },
      select: {
        id: true,
        clientId: true,
        password: true,
        role: true,
      },
    });

    if (!user) {
      throw new Error('Invalid client ID or password');
    }

    // Verify password
    const isValid = await this.passwordVerifier.verify(
      input.password,
      user.password
    );

    if (!isValid) {
      throw new Error('Invalid client ID or password');
    }

    // Update last login
    await this.legacy ORM.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      userId: user.id,
      clientId: user.clientId!,
      role: user.role,
    };
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(clientId: string): Promise<void> {
    const user = await this.legacy ORM.user.findUnique({
      where: { clientId },
      select: { id: true },
    });

    if (!user) {
      // Don't reveal if user exists
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    await this.legacy ORM.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      },
    });

    // TODO: Send reset email/SMS with token
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.legacy ORM.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gt: new Date() },
      },
      select: { id: true },
    });

    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    const hashedPassword = await bcryptjs.hash(newPassword, 10);

    await this.legacy ORM.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });
  }

  /**
   * Change password (authenticated user)
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await this.legacy ORM.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const isValid = await this.passwordVerifier.verify(
      currentPassword,
      user.password
    );

    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    const hashedPassword = await bcryptjs.hash(newPassword, 10);

    await this.legacy ORM.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }
}

export const idPasswordAuthService = new IdPasswordAuthService();
```

### 3.2 NextAuth Configuration Update

**File:** `auth.ts`

```typescript
import { auth } from "@auth/core";
import Credentials from "@auth/core/providers/credentials";
import { idPasswordAuthService } from "@/lib/auth/id-password-auth-service";

export const { handlers, auth, signIn, signOut } = auth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        clientId: { label: "Client ID", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.clientId || !credentials?.password) {
          return null;
        }

        try {
          const result = await idPasswordAuthService.authenticate({
            clientId: credentials.clientId as string,
            password: credentials.password as string,
          });

          return {
            id: result.userId,
            clientId: result.clientId,
            role: result.role,
          };
        } catch (error) {
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.clientId = user.clientId;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }: any) {
      session.user = {
        id: token.sub,
        clientId: token.clientId,
        role: token.role,
      };
      return session;
    },
  },
});
```

---

## Phase 4: UI/Form Updates

### 4.1 Login Form

**File:** `app/(auth)/login/page.tsx` (Update)

```typescript
// Change from email input to clientId input
// Fields: Client ID, Password
// Add "Forgot Password?" link
```

### 4.2 Join/Registration Form

**File:** `components/auth/join-form.tsx` (Update)

```typescript
// Remove: Email input
// Add: Name input (fullName)
// Add: Phone input (with validation)
// Password: Auto-generated (show on completion)
```

### 4.3 Settings - Password Reset

**File:** `app/(dashboard)/[role]/settings/page.tsx` (New section)

```typescript
// Current Password input
// New Password input
// Confirm Password input
// Change Password button
```

---

## Phase 5: Validators

### 5.1 New Validators

**File:** `lib/validators/client-registration.ts`

```typescript
export const clientRegistrationSchema = z.object({
  fullName: z.string().trim().min(2, "Name required"),
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, "Valid phone required"),
});

export const loginSchema = z.object({
  clientId: z.string()
    .regex(/^\d{7}$/, "Invalid Client ID format"),
  password: z.string().min(1, "Password required"),
});

export const passwordResetSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(8, "Min 8 characters"),
  confirmPassword: z.string(),
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  { message: "Passwords don't match", path: ["confirmPassword"] }
);

export const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8, "Min 8 characters"),
  confirmPassword: z.string(),
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  { message: "Passwords don't match", path: ["confirmPassword"] }
);
```

---

## Phase 6: Data Import

### 6.1 Bulk Import Script

**File:** `scripts/import-clients.ts`

```typescript
/**
 * Import clients from CSV/JSON
 * Usage: npx ts-node scripts/import-clients.ts
 * 
 * Input format:
 * {
 *   fullName: string
 *   phone: string
 *   email?: string (optional)
 * }
 */

import { clientRegistrationService } from '@/lib/services/client-registration-service';

export async function importClients(clients: Array<{
  fullName: string;
  phone: string;
  email?: string;
}>): Promise<void> {
  const results = [];

  for (const clientData of clients) {
    try {
      const result = await clientRegistrationService.registerClient({
        fullName: clientData.fullName,
        phone: clientData.phone,
        email: clientData.email,
      });

      results.push({
        status: 'success',
        clientId: result.clientId,
        temporaryPassword: result.temporaryPassword,
      });
    } catch (error) {
      results.push({
        status: 'error',
        fullName: clientData.fullName,
        error: (error as Error).message,
      });
    }
  }

  // Save results to file or return
  console.log(JSON.stringify(results, null, 2));
}
```

---

## Phase 7: Authorization Updates

### 7.1 Update Authorization Policy

**File:** `lib/auth/authorization-policy.ts` (Update)

```typescript
// Update to use clientId instead of email
// Verify clientId matches authenticated user
```

### 7.2 Update User Repository

**File:** `lib/repositories/user-repository.ts` (Update)

```typescript
// Change: findByEmail → findByClientId
// Add: getClientIdForUser()
// Update: All email-based lookups
```

---

## Implementation Checklist

### Database
- [ ] Create legacy ORM migration (add clientId, make email optional)
- [ ] Update User/Client schema
- [ ] Test migration rollback

### Services
- [ ] Implement ClientIdGenerator
- [ ] Implement PasswordGenerator
- [ ] Implement ClientRegistrationService
- [ ] Implement IdPasswordAuthService
- [ ] Write unit tests for services

### Auth
- [ ] Update NextAuth config
- [ ] Update auth middleware
- [ ] Update authorization checks
- [ ] Test auth flow end-to-end

### Forms & UI
- [ ] Update Login form
- [ ] Update Join form
- [ ] Add Password Reset page
- [ ] Add Settings → Change Password section
- [ ] Update all email references in UI

### Data
- [ ] Create CSV import script
- [ ] Test with sample data
- [ ] Create full import for 100 clients
- [ ] Generate credentials report

### Validation
- [ ] Create registration validator
- [ ] Create login validator
- [ ] Create password validators
- [ ] Write validator tests

### Testing
- [ ] ID generation tests
- [ ] Password generation tests
- [ ] Auth service tests
- [ ] Registration service tests
- [ ] E2E login flow tests

---

## File Structure Summary

```
NEW/UPDATED FILES:
├── legacy ORM/
│   └── schema.legacy ORM (MODIFY)
├── lib/
│   ├── services/
│   │   ├── client-id-generator.ts (NEW)
│   │   ├── password-generator.ts (NEW)
│   │   ├── client-registration-service.ts (NEW)
│   │   └── auth-service.ts (UPDATE)
│   ├── auth/
│   │   ├── id-password-auth-service.ts (NEW)
│   │   └── authorization-policy.ts (UPDATE)
│   ├── validators/
│   │   └── client-registration.ts (NEW)
│   └── repositories/
│       └── user-repository.ts (UPDATE)
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx (UPDATE)
│   └── (dashboard)/
│       └── [role]/settings/ (ADD password reset)
├── scripts/
│   └── import-clients.ts (NEW)
└── tests/
    ├── client-id-generator.test.ts (NEW)
    ├── password-generator.test.ts (NEW)
    └── client-registration-service.test.ts (NEW)
```

---

## Migration Path (For Existing Users)

1. **Week 1**: Deploy both systems (email + ID)
2. **Week 2-3**: Generate IDs for existing email users
3. **Week 4**: Offer migration: "Migrate to ID-based login"
4. **Week 5+**: Optional email login phase-out

---

## Questions Before Implementation

1. **Retroactive ID assignment**: Assign IDs to existing users? If yes, preserve their join date?
2. **Email migration**: Keep email login available during transition?
3. **Phone validation**: Required? Specific format (E.164)?
4. **Password complexity**: Any rules beyond auto-generated format?
5. **Reset delivery**: How to send reset links? (No email available initially)

---

**Ready to implement? Start with:**
1. legacy ORM migration
2. Services (ID/Password generators)
3. Auth service refactor
4. Tests

Should I proceed? 🚀
