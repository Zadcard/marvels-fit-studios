CREATE TYPE "ClientPaymentStatus" AS ENUM ('PAID', 'UNPAID', 'DUE_SOON');

ALTER TABLE "Client"
ADD COLUMN "paymentStatus" "ClientPaymentStatus" NOT NULL DEFAULT 'UNPAID';

UPDATE "Client"
SET "paymentStatus" = CASE
  WHEN "isPaid" = TRUE THEN 'PAID'::"ClientPaymentStatus"
  ELSE 'UNPAID'::"ClientPaymentStatus"
END;
