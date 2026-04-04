-- ─── Enums ───────────────────────────────────────────────────────────────────

CREATE TYPE "PaymentType" AS ENUM ('MONTHLY', 'SESSIONS');

-- ─── Tables ──────────────────────────────────────────────────────────────────

CREATE TABLE "Admin" (
  "id"       TEXT NOT NULL,
  "email"    TEXT NOT NULL,
  "password" TEXT NOT NULL,

  CONSTRAINT "Admin_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Admin_email_key" UNIQUE ("email")
);

CREATE TABLE "Coach" (
  "id"       TEXT    NOT NULL,
  "fullName" TEXT    NOT NULL,
  "email"    TEXT    NOT NULL,
  "password" TEXT    NOT NULL,
  "phone"    TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,

  CONSTRAINT "Coach_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Coach_email_key" UNIQUE ("email")
);

CREATE TABLE "Group" (
  "id"      TEXT NOT NULL,
  "name"    TEXT NOT NULL,
  "coachId" TEXT NOT NULL,

  CONSTRAINT "Group_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Group_coachId_fkey" FOREIGN KEY ("coachId")
    REFERENCES "Coach"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "Client" (
  "id"               TEXT         NOT NULL,
  "fullName"         TEXT         NOT NULL,
  "email"            TEXT         NOT NULL,
  "password"         TEXT         NOT NULL,
  "phone"            TEXT,
  "dateOfBirth"      TIMESTAMP(3),
  "membershipType"   "PaymentType",
  "membershipExpiry" TIMESTAMP(3),
  "sessionsLeft"     INTEGER      NOT NULL DEFAULT 0,
  "isPaid"           BOOLEAN      NOT NULL DEFAULT false,
  "isActive"         BOOLEAN      NOT NULL DEFAULT true,
  "lastActiveAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "groupId"          TEXT,

  CONSTRAINT "Client_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Client_email_key" UNIQUE ("email"),
  CONSTRAINT "Client_groupId_fkey" FOREIGN KEY ("groupId")
    REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "Payment" (
  "id"            TEXT         NOT NULL,
  "clientId"      TEXT         NOT NULL,
  "amount"        DOUBLE PRECISION NOT NULL,
  "currency"      TEXT         NOT NULL DEFAULT 'EGP',
  "type"          "PaymentType" NOT NULL,
  "sessionsCount" INTEGER,
  "expiresAt"     TIMESTAMP(3) NOT NULL,
  "date"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "note"          TEXT,

  CONSTRAINT "Payment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Payment_clientId_fkey" FOREIGN KEY ("clientId")
    REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "SessionLog" (
  "id"        TEXT         NOT NULL,
  "clientId"  TEXT         NOT NULL,
  "paymentId" TEXT,
  "usedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "note"      TEXT,

  CONSTRAINT "SessionLog_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SessionLog_clientId_fkey" FOREIGN KEY ("clientId")
    REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SessionLog_paymentId_fkey" FOREIGN KEY ("paymentId")
    REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "File" (
  "id"           TEXT         NOT NULL,
  "name"         TEXT         NOT NULL,
  "url"          TEXT         NOT NULL,
  "groupId"      TEXT         NOT NULL,
  "clientId"     TEXT,
  "uploadedById" TEXT         NOT NULL,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "File_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "File_groupId_fkey" FOREIGN KEY ("groupId")
    REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "File_clientId_fkey" FOREIGN KEY ("clientId")
    REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "File_uploadedById_fkey" FOREIGN KEY ("uploadedById")
    REFERENCES "Coach"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "WorkoutNote" (
  "id"        TEXT         NOT NULL,
  "clientId"  TEXT         NOT NULL,
  "title"     TEXT,
  "content"   TEXT         NOT NULL,
  "date"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "WorkoutNote_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WorkoutNote_clientId_fkey" FOREIGN KEY ("clientId")
    REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "RefreshToken" (
  "id"        TEXT         NOT NULL,
  "token"     TEXT         NOT NULL,
  "userId"    TEXT         NOT NULL,
  "userType"  TEXT         NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RefreshToken_token_key" UNIQUE ("token")
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX "Group_coachId_idx"      ON "Group"("coachId");
CREATE INDEX "Client_groupId_idx"     ON "Client"("groupId");
CREATE INDEX "Client_isActive_idx"    ON "Client"("isActive");
CREATE INDEX "Client_lastActiveAt_idx" ON "Client"("lastActiveAt");
CREATE INDEX "Payment_clientId_idx"   ON "Payment"("clientId");
CREATE INDEX "SessionLog_clientId_idx" ON "SessionLog"("clientId");
CREATE INDEX "SessionLog_paymentId_idx" ON "SessionLog"("paymentId");
CREATE INDEX "File_groupId_idx"       ON "File"("groupId");
CREATE INDEX "File_clientId_idx"      ON "File"("clientId");
CREATE INDEX "File_uploadedById_idx"  ON "File"("uploadedById");
CREATE INDEX "WorkoutNote_clientId_idx" ON "WorkoutNote"("clientId");
CREATE INDEX "RefreshToken_token_idx" ON "RefreshToken"("token");
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");
