-- AlterEnum
ALTER TYPE "DocumentType" ADD VALUE 'PASSPORT';

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "blacklistReason" TEXT,
ADD COLUMN     "blacklisted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "ocrText" TEXT;

-- CreateIndex
CREATE INDEX "customers_blacklisted_idx" ON "customers"("blacklisted");
