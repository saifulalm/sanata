-- CreateEnum
CREATE TYPE "ProgressStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "Weather" AS ENUM ('CERAH', 'BERAWAN', 'GERIMIS', 'HUJAN', 'HUJAN_LEBAT');

-- CreateEnum
CREATE TYPE "BillingStatus" AS ENUM ('DRAFT', 'ISSUED', 'PAID', 'CANCELLED');

-- AlterTable
ALTER TABLE "Rab" ADD COLUMN     "restDays" INTEGER[] DEFAULT ARRAY[0]::INTEGER[];

-- AlterTable
ALTER TABLE "RabProgress" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedById" TEXT,
ADD COLUMN     "rejectReason" TEXT,
ADD COLUMN     "status" "ProgressStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "RabHoliday" (
    "id" TEXT NOT NULL,
    "rabId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "RabHoliday_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RabScheduleBaseline" (
    "id" TEXT NOT NULL,
    "rabId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "capturedById" TEXT,
    "snapshot" JSONB NOT NULL,

    CONSTRAINT "RabScheduleBaseline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RabProgressPhoto" (
    "id" TEXT NOT NULL,
    "progressId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RabProgressPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyReport" (
    "id" TEXT NOT NULL,
    "rabId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "weatherMorning" "Weather",
    "weatherAfternoon" "Weather",
    "workforce" JSONB,
    "equipment" TEXT,
    "materials" TEXT,
    "activities" TEXT NOT NULL,
    "obstacles" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "DailyReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyReportPhoto" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "location" TEXT,
    "takenAt" TIMESTAMP(3),
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DailyReportPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgressBilling" (
    "id" TEXT NOT NULL,
    "rabId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "status" "BillingStatus" NOT NULL DEFAULT 'DRAFT',
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "cumulativeValue" DECIMAL(18,2) NOT NULL,
    "previousValue" DECIMAL(18,2) NOT NULL,
    "currentValue" DECIMAL(18,2) NOT NULL,
    "retentionPct" DECIMAL(5,2) NOT NULL DEFAULT 5,
    "retentionAmount" DECIMAL(18,2) NOT NULL,
    "taxPct" DECIMAL(5,2) NOT NULL DEFAULT 11,
    "taxAmount" DECIMAL(18,2) NOT NULL,
    "netAmount" DECIMAL(18,2) NOT NULL,
    "notes" TEXT,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "ProgressBilling_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RabHoliday_rabId_idx" ON "RabHoliday"("rabId");

-- CreateIndex
CREATE UNIQUE INDEX "RabHoliday_rabId_date_key" ON "RabHoliday"("rabId", "date");

-- CreateIndex
CREATE INDEX "RabScheduleBaseline_rabId_idx" ON "RabScheduleBaseline"("rabId");

-- CreateIndex
CREATE INDEX "RabProgressPhoto_progressId_idx" ON "RabProgressPhoto"("progressId");

-- CreateIndex
CREATE INDEX "DailyReport_rabId_date_idx" ON "DailyReport"("rabId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyReport_rabId_date_key" ON "DailyReport"("rabId", "date");

-- CreateIndex
CREATE INDEX "DailyReportPhoto_reportId_idx" ON "DailyReportPhoto"("reportId");

-- CreateIndex
CREATE UNIQUE INDEX "ProgressBilling_number_key" ON "ProgressBilling"("number");

-- CreateIndex
CREATE INDEX "ProgressBilling_rabId_idx" ON "ProgressBilling"("rabId");

-- CreateIndex
CREATE INDEX "ProgressBilling_status_idx" ON "ProgressBilling"("status");

-- CreateIndex
CREATE INDEX "RabProgress_status_idx" ON "RabProgress"("status");

-- AddForeignKey
ALTER TABLE "RabHoliday" ADD CONSTRAINT "RabHoliday_rabId_fkey" FOREIGN KEY ("rabId") REFERENCES "Rab"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RabScheduleBaseline" ADD CONSTRAINT "RabScheduleBaseline_rabId_fkey" FOREIGN KEY ("rabId") REFERENCES "Rab"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RabScheduleBaseline" ADD CONSTRAINT "RabScheduleBaseline_capturedById_fkey" FOREIGN KEY ("capturedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RabProgress" ADD CONSTRAINT "RabProgress_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RabProgressPhoto" ADD CONSTRAINT "RabProgressPhoto_progressId_fkey" FOREIGN KEY ("progressId") REFERENCES "RabProgress"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyReport" ADD CONSTRAINT "DailyReport_rabId_fkey" FOREIGN KEY ("rabId") REFERENCES "Rab"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyReport" ADD CONSTRAINT "DailyReport_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyReportPhoto" ADD CONSTRAINT "DailyReportPhoto_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "DailyReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressBilling" ADD CONSTRAINT "ProgressBilling_rabId_fkey" FOREIGN KEY ("rabId") REFERENCES "Rab"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressBilling" ADD CONSTRAINT "ProgressBilling_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
