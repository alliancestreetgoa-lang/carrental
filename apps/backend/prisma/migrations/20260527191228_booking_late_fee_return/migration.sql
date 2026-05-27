-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "actualReturnDate" TIMESTAMP(3),
ADD COLUMN     "lateFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "returnFuelLevel" TEXT;
