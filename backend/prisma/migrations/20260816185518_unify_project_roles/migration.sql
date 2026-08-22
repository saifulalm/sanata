/*
  Warnings:

  - The `role` column on the `Signatory` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ProjectRole" AS ENUM ('DIREKTUR_UTAMA', 'DIREKTUR', 'MANAGER_PROYEK', 'SITE_MANAGER', 'PIMPINAN_PROYEK', 'KEPALA_TUKANG', 'TUKANG_BATU', 'TUKANG_KAYU', 'TUKANG_BESI', 'OPERATOR', 'MANDOR', 'PEKERJA', 'STAF', 'LAINNYA');

-- AlterTable
ALTER TABLE "Signatory" DROP COLUMN "role",
ADD COLUMN     "role" "ProjectRole";

-- DropEnum
DROP TYPE "SignatoryRole";

-- CreateTable
CREATE TABLE "WorkforceRole" (
    "id" TEXT NOT NULL,
    "role" "ProjectRole" NOT NULL,
    "label" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkforceRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyReportWorkforce" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "role" "ProjectRole" NOT NULL,
    "count" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DailyReportWorkforce_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkforceRole_role_key" ON "WorkforceRole"("role");

-- CreateIndex
CREATE INDEX "DailyReportWorkforce_reportId_idx" ON "DailyReportWorkforce"("reportId");

-- AddForeignKey
ALTER TABLE "DailyReportWorkforce" ADD CONSTRAINT "DailyReportWorkforce_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "DailyReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
