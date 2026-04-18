-- Add ID-based authentication fields to the unified Auth.js user table.
ALTER TABLE "User"
ADD COLUMN "clientId" TEXT,
ADD COLUMN "passwordResetToken" TEXT,
ADD COLUMN "passwordResetExpires" TIMESTAMP(3),
ADD COLUMN "lastLoginAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "User_clientId_key" ON "User"("clientId");
CREATE UNIQUE INDEX "User_passwordResetToken_key" ON "User"("passwordResetToken");
CREATE INDEX "User_clientId_idx" ON "User"("clientId");
CREATE INDEX "User_email_idx" ON "User"("email");
