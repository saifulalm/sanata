-- CreateEnum
CREATE TYPE "SubmissionType" AS ENUM ('ALAT', 'MATERIAL', 'WAKTU', 'RENCANA_WAKTU');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED_INTERNAL', 'FORWARDED_CLIENT', 'APPROVED_CLIENT', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LogbookCategory" AS ENUM ('KUNJUNGAN_CLIENT', 'KUNJUNGAN_KONSULTAN', 'INSTRUKSI_LAPANGAN', 'KEAMANAN', 'KESALAHAN_KERJA', 'KECELAKAAN_KERJA', 'KERUSAKAN_ALAT', 'GANGGUAN_CUACA', 'GANGGUAN_WARGA', 'LAINNYA');

-- CreateEnum
CREATE TYPE "LogbookSeverity" AS ENUM ('INFO', 'RINGAN', 'SEDANG', 'BERAT', 'KRITIS');

-- CreateEnum
CREATE TYPE "MemoDirection" AS ENUM ('INCOMING', 'OUTGOING');

-- CreateEnum
CREATE TYPE "MemoCategory" AS ENUM ('KOMPLAIN', 'INSTRUKSI', 'TEGURAN', 'PERMINTAAN_INFO', 'KLARIFIKASI', 'APPROVAL', 'ADDENDUM', 'LAINNYA');

-- CreateEnum
CREATE TYPE "MemoStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'ANSWERED', 'CLOSED');

-- CreateEnum
CREATE TYPE "LetterType" AS ENUM ('SPK', 'INVOICE', 'KWITANSI', 'BAPP', 'BAST');

-- CreateEnum
CREATE TYPE "LetterStatus" AS ENUM ('DRAFT', 'ISSUED', 'SIGNED', 'PAID', 'CANCELLED');

-- CreateTable
CREATE TABLE "DocumentCounter" (
    "id" TEXT NOT NULL,
    "series" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "lastSeq" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentCounter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectSubmission" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "rabId" TEXT NOT NULL,
    "type" "SubmissionType" NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "reason" TEXT,
    "neededDate" TIMESTAMP(3),
    "requestedDays" INTEGER,
    "newTargetDate" TIMESTAMP(3),
    "estimatedCost" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "attachments" JSONB,
    "requestedById" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "forwardedAt" TIMESTAMP(3),
    "clientDecidedAt" TIMESTAMP(3),
    "clientDecidedBy" TEXT,
    "clientNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectSubmissionItem" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "spec" TEXT,
    "unit" TEXT NOT NULL,
    "quantity" DECIMAL(15,3) NOT NULL,
    "unitPrice" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "note" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProjectSubmissionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogbookEntry" (
    "id" TEXT NOT NULL,
    "rabId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "timeOfDay" TEXT,
    "category" "LogbookCategory" NOT NULL,
    "severity" "LogbookSeverity" NOT NULL DEFAULT 'INFO',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "involvedParty" TEXT,
    "actionTaken" TEXT,
    "followUp" TEXT,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "LogbookEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteMemo" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "rabId" TEXT NOT NULL,
    "direction" "MemoDirection" NOT NULL,
    "category" "MemoCategory" NOT NULL DEFAULT 'LAINNYA',
    "status" "MemoStatus" NOT NULL DEFAULT 'OPEN',
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "fromParty" TEXT NOT NULL,
    "toParty" TEXT NOT NULL,
    "letterDate" TIMESTAMP(3) NOT NULL,
    "handledAt" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "parentId" TEXT,
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "SiteMemo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectLetter" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "rabId" TEXT NOT NULL,
    "type" "LetterType" NOT NULL,
    "status" "LetterStatus" NOT NULL DEFAULT 'DRAFT',
    "subject" TEXT NOT NULL,
    "letterDate" TIMESTAMP(3) NOT NULL,
    "issuedAt" TIMESTAMP(3),
    "signedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "recipientName" TEXT NOT NULL,
    "recipientCompany" TEXT,
    "recipientAddress" TEXT,
    "attentionTo" TEXT,
    "signerName" TEXT NOT NULL,
    "signerTitle" TEXT NOT NULL,
    "counterSignerName" TEXT,
    "counterSignerTitle" TEXT,
    "amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "retentionAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "taxPct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "amountInWords" TEXT,
    "body" JSONB NOT NULL,
    "snapshot" JSONB,
    "billingId" TEXT,
    "quotationId" TEXT,
    "parentLetterId" TEXT,
    "notes" TEXT,
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "ProjectLetter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DocumentCounter_series_year_key" ON "DocumentCounter"("series", "year");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectSubmission_number_key" ON "ProjectSubmission"("number");

-- CreateIndex
CREATE INDEX "ProjectSubmission_rabId_type_idx" ON "ProjectSubmission"("rabId", "type");

-- CreateIndex
CREATE INDEX "ProjectSubmission_status_idx" ON "ProjectSubmission"("status");

-- CreateIndex
CREATE INDEX "ProjectSubmissionItem_submissionId_idx" ON "ProjectSubmissionItem"("submissionId");

-- CreateIndex
CREATE INDEX "LogbookEntry_rabId_date_idx" ON "LogbookEntry"("rabId", "date");

-- CreateIndex
CREATE INDEX "LogbookEntry_category_idx" ON "LogbookEntry"("category");

-- CreateIndex
CREATE UNIQUE INDEX "SiteMemo_number_key" ON "SiteMemo"("number");

-- CreateIndex
CREATE INDEX "SiteMemo_rabId_direction_idx" ON "SiteMemo"("rabId", "direction");

-- CreateIndex
CREATE INDEX "SiteMemo_status_idx" ON "SiteMemo"("status");

-- CreateIndex
CREATE INDEX "SiteMemo_parentId_idx" ON "SiteMemo"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectLetter_number_key" ON "ProjectLetter"("number");

-- CreateIndex
CREATE INDEX "ProjectLetter_rabId_type_idx" ON "ProjectLetter"("rabId", "type");

-- CreateIndex
CREATE INDEX "ProjectLetter_status_idx" ON "ProjectLetter"("status");

-- CreateIndex
CREATE INDEX "ProjectLetter_billingId_idx" ON "ProjectLetter"("billingId");

-- AddForeignKey
ALTER TABLE "ProjectSubmission" ADD CONSTRAINT "ProjectSubmission_rabId_fkey" FOREIGN KEY ("rabId") REFERENCES "Rab"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectSubmission" ADD CONSTRAINT "ProjectSubmission_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectSubmission" ADD CONSTRAINT "ProjectSubmission_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectSubmissionItem" ADD CONSTRAINT "ProjectSubmissionItem_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ProjectSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogbookEntry" ADD CONSTRAINT "LogbookEntry_rabId_fkey" FOREIGN KEY ("rabId") REFERENCES "Rab"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogbookEntry" ADD CONSTRAINT "LogbookEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteMemo" ADD CONSTRAINT "SiteMemo_rabId_fkey" FOREIGN KEY ("rabId") REFERENCES "Rab"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteMemo" ADD CONSTRAINT "SiteMemo_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "SiteMemo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteMemo" ADD CONSTRAINT "SiteMemo_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectLetter" ADD CONSTRAINT "ProjectLetter_rabId_fkey" FOREIGN KEY ("rabId") REFERENCES "Rab"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectLetter" ADD CONSTRAINT "ProjectLetter_billingId_fkey" FOREIGN KEY ("billingId") REFERENCES "ProgressBilling"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectLetter" ADD CONSTRAINT "ProjectLetter_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectLetter" ADD CONSTRAINT "ProjectLetter_parentLetterId_fkey" FOREIGN KEY ("parentLetterId") REFERENCES "ProjectLetter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectLetter" ADD CONSTRAINT "ProjectLetter_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
