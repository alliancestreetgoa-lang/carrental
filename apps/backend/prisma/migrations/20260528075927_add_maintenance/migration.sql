-- CreateEnum
CREATE TYPE "MaintenanceType" AS ENUM ('SERVICE', 'OIL_CHANGE', 'TYRE', 'BRAKES', 'BATTERY', 'REPAIR', 'INSPECTION', 'CLEANING', 'OTHER');

-- CreateEnum
CREATE TYPE "MaintenanceStatus" AS ENUM ('SCHEDULED', 'COMPLETED');

-- CreateTable
CREATE TABLE "maintenance_records" (
    "id" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "type" "MaintenanceType" NOT NULL DEFAULT 'SERVICE',
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'COMPLETED',
    "serviceDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "odometer" INTEGER,
    "cost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "serviceCenter" TEXT,
    "notes" TEXT,
    "expenseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "maintenance_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "maintenance_records_carId_idx" ON "maintenance_records"("carId");

-- CreateIndex
CREATE INDEX "maintenance_records_type_idx" ON "maintenance_records"("type");

-- CreateIndex
CREATE INDEX "maintenance_records_status_idx" ON "maintenance_records"("status");

-- CreateIndex
CREATE INDEX "maintenance_records_serviceDate_idx" ON "maintenance_records"("serviceDate");

-- CreateIndex
CREATE INDEX "maintenance_records_dueDate_idx" ON "maintenance_records"("dueDate");

-- CreateIndex
CREATE INDEX "maintenance_records_deletedAt_idx" ON "maintenance_records"("deletedAt");

-- AddForeignKey
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_carId_fkey" FOREIGN KEY ("carId") REFERENCES "cars"("id") ON DELETE CASCADE ON UPDATE CASCADE;
