-- CreateEnum
CREATE TYPE "SignatoryRole" AS ENUM ('DIREKTUR_UTAMA', 'DIREKTUR', 'MANAGER_PROYEK', 'SITE_MANAGER', 'PIMPINAN_PROYEK', 'STAF', 'LAINNYA');

-- AlterTable
ALTER TABLE "ProjectLetter" ADD COLUMN     "signatoryId" TEXT;

-- AlterTable
ALTER TABLE "Quotation" ADD COLUMN     "signatoryId" TEXT;

-- CreateTable
CREATE TABLE "Signatory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "role" "SignatoryRole",
    "department" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Signatory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Signatory_isActive_idx" ON "Signatory"("isActive");

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_signatoryId_fkey" FOREIGN KEY ("signatoryId") REFERENCES "Signatory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectLetter" ADD CONSTRAINT "ProjectLetter_signatoryId_fkey" FOREIGN KEY ("signatoryId") REFERENCES "Signatory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
