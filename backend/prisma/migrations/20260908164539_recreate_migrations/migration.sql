/*
  Warnings:

  - A unique constraint covering the columns `[collection,title]` on the table `SiteCollectionItem` will be added. If there are existing duplicate values, this will fail.
  - Made the column `title` on table `SiteCollectionItem` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "WorkerStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED');

-- CreateEnum
CREATE TYPE "WorkerGrade" AS ENUM ('A', 'B', 'C', 'D');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "QcResult" AS ENUM ('PASS', 'FAIL', 'REWORK');

-- CreateEnum
CREATE TYPE "ToolCondition" AS ENUM ('GOOD', 'FAIR', 'DAMAGED', 'LOST');

-- CreateEnum
CREATE TYPE "ToolOwner" AS ENUM ('COMPANY', 'PERSONAL', 'RENTED');

-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('OPEN', 'RETURNED', 'OVERDUE', 'LOST');

-- CreateEnum
CREATE TYPE "WbsStage" AS ENUM ('PRE_CONSTRUCTION', 'SITE_PREPARATION', 'EARTHWORK', 'FOUNDATION', 'STRUCTURE', 'MASONRY', 'ROOF', 'MEP', 'WATERPROOFING', 'PLASTER_SCREED', 'FLOOR_WALL_FINISH', 'CEILING', 'DOORS_WINDOWS', 'PAINTING', 'EXTERNAL_WORKS', 'TESTING_COMMISSIONING', 'SNAGGING', 'HANDOVER');

-- CreateEnum
CREATE TYPE "CheckType" AS ENUM ('PRE_CHECK', 'POST_CHECK', 'FINAL_CHECK');

-- CreateEnum
CREATE TYPE "QcSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "MaintenanceType" AS ENUM ('PREVENTIVE', 'CORRECTIVE', 'INSPECTION');

-- AlterTable
ALTER TABLE "DailyReport" ADD COLUMN     "testPerformed" TEXT,
ADD COLUMN     "weatherLog" JSONB,
ADD COLUMN     "workActivities" JSONB;

-- AlterTable
ALTER TABLE "DailyReportPhoto" ADD COLUMN     "annotations" JSONB,
ADD COLUMN     "originalUrl" TEXT;

-- AlterTable
ALTER TABLE "SiteCollectionItem" ALTER COLUMN "title" SET NOT NULL;

-- CreateTable
CREATE TABLE "Worker" (
    "id" TEXT NOT NULL,
    "workerCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "ProjectRole" NOT NULL,
    "ktpNumber" TEXT,
    "ktpPhotoUrl" TEXT,
    "facePhotoUrl" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "status" "WorkerStatus" NOT NULL DEFAULT 'ACTIVE',
    "joinDate" TIMESTAMP(3),
    "grade" "WorkerGrade",
    "rate" DECIMAL(12,2),
    "skills" TEXT[],
    "experienceYears" INTEGER DEFAULT 0,
    "certificates" TEXT[],
    "skillNotes" TEXT,
    "personalTools" TEXT[],
    "ktpVerified" BOOLEAN NOT NULL DEFAULT false,
    "profileComplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Worker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerAssessment" (
    "id" TEXT NOT NULL,
    "assessmentCode" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "assessmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "interviewer" TEXT,
    "technicalScore" INTEGER,
    "interviewScore" INTEGER,
    "teamworkScore" INTEGER,
    "safetyScore" INTEGER,
    "overallScore" INTEGER,
    "grade" "WorkerGrade",
    "recommendation" TEXT,
    "notes" TEXT,
    "evidenceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkerAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobAssignment" (
    "id" TEXT NOT NULL,
    "assignmentCode" TEXT NOT NULL,
    "rabId" TEXT,
    "wbsCode" TEXT,
    "wbsStage" "WbsStage",
    "workItem" TEXT NOT NULL,
    "methodRef" TEXT,
    "methodCode" TEXT,
    "methodStatementId" TEXT,
    "acceptanceCriteria" TEXT,
    "tolerance" TEXT,
    "evidenceRequirement" TEXT[],
    "responsiblePersonId" TEXT,
    "responsibleMandorId" TEXT,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'PENDING',
    "priority" INTEGER NOT NULL DEFAULT 5,
    "plannedStart" TIMESTAMP(3),
    "plannedEnd" TIMESTAMP(3),
    "actualStart" TIMESTAMP(3),
    "actualEnd" TIMESTAMP(3),
    "scopeDescription" TEXT,
    "materials" TEXT,
    "toolsNeeded" TEXT[],
    "progressPct" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExecutionLog" (
    "id" TEXT NOT NULL,
    "logCode" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "logDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "locationName" TEXT,
    "progressPct" INTEGER DEFAULT 0,
    "dailyReportId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExecutionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExecutionPhoto" (
    "id" TEXT NOT NULL,
    "logId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "location" TEXT,
    "takenAt" TIMESTAMP(3),
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExecutionPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QcRecord" (
    "id" TEXT NOT NULL,
    "qcCode" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "wbsStage" "WbsStage",
    "methodCode" TEXT,
    "checkType" "CheckType" NOT NULL DEFAULT 'POST_CHECK',
    "templateId" TEXT,
    "checkDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "itemDesc" TEXT,
    "criteria" TEXT,
    "measurement" TEXT,
    "tolerance" TEXT,
    "result" "QcResult" NOT NULL,
    "defectDesc" TEXT,
    "defectPhotoUrl" TEXT,
    "isRework" BOOLEAN NOT NULL DEFAULT false,
    "reworkOfId" TEXT,
    "holdPoint" BOOLEAN NOT NULL DEFAULT false,
    "isReleased" BOOLEAN NOT NULL DEFAULT false,
    "releasedById" TEXT,
    "releasedAt" TIMESTAMP(3),
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "weather" TEXT,
    "temperature" DECIMAL(5,2),
    "photosCount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QcRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QcPhoto" (
    "id" TEXT NOT NULL,
    "qcId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QcPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QcApprovalLog" (
    "id" TEXT NOT NULL,
    "qcId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "approverName" TEXT,
    "approverRole" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QcApprovalLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonLearned" (
    "id" TEXT NOT NULL,
    "wbsStage" "WbsStage",
    "qcRecordId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rootCause" TEXT,
    "correctiveAction" TEXT,
    "preventiveAction" TEXT,
    "severity" "QcSeverity" NOT NULL DEFAULT 'MEDIUM',
    "occurredAt" TIMESTAMP(3),
    "createdById" TEXT,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonLearned_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MethodStatement" (
    "id" TEXT NOT NULL,
    "methodCode" TEXT NOT NULL,
    "wbsStage" "WbsStage" NOT NULL,
    "workItem" TEXT NOT NULL,
    "scope" TEXT,
    "reference" TEXT,
    "tools" TEXT[],
    "materials" TEXT[],
    "precondition" TEXT,
    "sequence" JSONB,
    "criticalPoints" TEXT,
    "acceptanceCriteria" TEXT NOT NULL,
    "tolerance" TEXT,
    "holdPoint" BOOLEAN NOT NULL DEFAULT false,
    "safety" TEXT,
    "evidenceRequirement" TEXT[],
    "reworkProcedure" TEXT,
    "responsibleRoles" TEXT[],
    "revision" INTEGER NOT NULL DEFAULT 1,
    "lessonLearned" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MethodStatement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QcTemplate" (
    "id" TEXT NOT NULL,
    "wbsStage" "WbsStage" NOT NULL,
    "methodCode" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "items" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QcTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KpiRecord" (
    "id" TEXT NOT NULL,
    "kpiCode" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "qualityScore" INTEGER,
    "productivityScore" INTEGER,
    "attendanceScore" INTEGER,
    "safetyScore" INTEGER,
    "reworkCount" INTEGER NOT NULL DEFAULT 0,
    "defectCount" INTEGER NOT NULL DEFAULT 0,
    "completedTasks" INTEGER NOT NULL DEFAULT 0,
    "lateDays" INTEGER NOT NULL DEFAULT 0,
    "overallScore" INTEGER,
    "rank" INTEGER,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KpiRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToolMaintenance" (
    "id" TEXT NOT NULL,
    "maintenanceCode" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "type" "MaintenanceType" NOT NULL DEFAULT 'PREVENTIVE',
    "description" TEXT NOT NULL,
    "performedById" TEXT,
    "scheduledDate" TIMESTAMP(3),
    "performedDate" TIMESTAMP(3),
    "cost" DECIMAL(12,2),
    "vendor" TEXT,
    "conditionAfter" "ToolCondition",
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ToolMaintenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToolActivity" (
    "id" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "performedById" TEXT,
    "loanId" TEXT,
    "workerId" TEXT,
    "condition" "ToolCondition",
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ToolActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MasterTool" (
    "id" TEXT NOT NULL,
    "toolCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "trade" TEXT,
    "minQuantity" INTEGER NOT NULL DEFAULT 1,
    "unit" TEXT NOT NULL DEFAULT 'pcs',
    "brand" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "warrantyExpiry" TIMESTAMP(3),
    "purchasePrice" DECIMAL(12,2),
    "currentCondition" "ToolCondition" NOT NULL DEFAULT 'GOOD',
    "owner" "ToolOwner" NOT NULL DEFAULT 'COMPANY',
    "personalOwnerId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "imageUrl" TEXT,
    "needsMaintenance" BOOLEAN NOT NULL DEFAULT false,
    "maintenanceIntervalDays" INTEGER,
    "lastMaintenanceDate" TIMESTAMP(3),
    "nextMaintenanceDate" TIMESTAMP(3),
    "currentLocation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MasterTool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToolPhoto" (
    "id" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ToolPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToolLoan" (
    "id" TEXT NOT NULL,
    "loanCode" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "issuedById" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returnedAt" TIMESTAMP(3),
    "returnedCondition" "ToolCondition",
    "status" "LoanStatus" NOT NULL DEFAULT 'OPEN',
    "issuedPhotoUrl" TEXT,
    "returnedPhotoUrl" TEXT,
    "issuedLocation" TEXT,
    "returnLocation" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ToolLoan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SantraCounter" (
    "id" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "lastSeq" INTEGER NOT NULL DEFAULT 0,
    "year" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SantraCounter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Worker_workerCode_key" ON "Worker"("workerCode");

-- CreateIndex
CREATE UNIQUE INDEX "Worker_ktpNumber_key" ON "Worker"("ktpNumber");

-- CreateIndex
CREATE INDEX "Worker_workerCode_idx" ON "Worker"("workerCode");

-- CreateIndex
CREATE INDEX "Worker_role_idx" ON "Worker"("role");

-- CreateIndex
CREATE INDEX "Worker_status_idx" ON "Worker"("status");

-- CreateIndex
CREATE INDEX "Worker_grade_idx" ON "Worker"("grade");

-- CreateIndex
CREATE UNIQUE INDEX "WorkerAssessment_assessmentCode_key" ON "WorkerAssessment"("assessmentCode");

-- CreateIndex
CREATE INDEX "WorkerAssessment_workerId_idx" ON "WorkerAssessment"("workerId");

-- CreateIndex
CREATE INDEX "WorkerAssessment_assessmentDate_idx" ON "WorkerAssessment"("assessmentDate");

-- CreateIndex
CREATE UNIQUE INDEX "JobAssignment_assignmentCode_key" ON "JobAssignment"("assignmentCode");

-- CreateIndex
CREATE INDEX "JobAssignment_rabId_idx" ON "JobAssignment"("rabId");

-- CreateIndex
CREATE INDEX "JobAssignment_responsiblePersonId_idx" ON "JobAssignment"("responsiblePersonId");

-- CreateIndex
CREATE INDEX "JobAssignment_responsibleMandorId_idx" ON "JobAssignment"("responsibleMandorId");

-- CreateIndex
CREATE INDEX "JobAssignment_status_idx" ON "JobAssignment"("status");

-- CreateIndex
CREATE INDEX "JobAssignment_wbsCode_idx" ON "JobAssignment"("wbsCode");

-- CreateIndex
CREATE INDEX "JobAssignment_methodStatementId_idx" ON "JobAssignment"("methodStatementId");

-- CreateIndex
CREATE UNIQUE INDEX "ExecutionLog_logCode_key" ON "ExecutionLog"("logCode");

-- CreateIndex
CREATE INDEX "ExecutionLog_assignmentId_idx" ON "ExecutionLog"("assignmentId");

-- CreateIndex
CREATE INDEX "ExecutionLog_workerId_idx" ON "ExecutionLog"("workerId");

-- CreateIndex
CREATE INDEX "ExecutionLog_logDate_idx" ON "ExecutionLog"("logDate");

-- CreateIndex
CREATE INDEX "ExecutionLog_dailyReportId_idx" ON "ExecutionLog"("dailyReportId");

-- CreateIndex
CREATE INDEX "ExecutionPhoto_logId_idx" ON "ExecutionPhoto"("logId");

-- CreateIndex
CREATE UNIQUE INDEX "QcRecord_qcCode_key" ON "QcRecord"("qcCode");

-- CreateIndex
CREATE INDEX "QcRecord_assignmentId_idx" ON "QcRecord"("assignmentId");

-- CreateIndex
CREATE INDEX "QcRecord_workerId_idx" ON "QcRecord"("workerId");

-- CreateIndex
CREATE INDEX "QcRecord_result_idx" ON "QcRecord"("result");

-- CreateIndex
CREATE INDEX "QcRecord_checkDate_idx" ON "QcRecord"("checkDate");

-- CreateIndex
CREATE INDEX "QcRecord_wbsStage_idx" ON "QcRecord"("wbsStage");

-- CreateIndex
CREATE INDEX "QcRecord_methodCode_idx" ON "QcRecord"("methodCode");

-- CreateIndex
CREATE INDEX "QcRecord_checkType_idx" ON "QcRecord"("checkType");

-- CreateIndex
CREATE INDEX "QcRecord_holdPoint_idx" ON "QcRecord"("holdPoint");

-- CreateIndex
CREATE INDEX "QcRecord_isReleased_idx" ON "QcRecord"("isReleased");

-- CreateIndex
CREATE INDEX "QcRecord_weather_idx" ON "QcRecord"("weather");

-- CreateIndex
CREATE INDEX "QcPhoto_qcId_idx" ON "QcPhoto"("qcId");

-- CreateIndex
CREATE INDEX "QcApprovalLog_qcId_idx" ON "QcApprovalLog"("qcId");

-- CreateIndex
CREATE INDEX "QcApprovalLog_approverId_idx" ON "QcApprovalLog"("approverId");

-- CreateIndex
CREATE INDEX "LessonLearned_wbsStage_idx" ON "LessonLearned"("wbsStage");

-- CreateIndex
CREATE INDEX "LessonLearned_qcRecordId_idx" ON "LessonLearned"("qcRecordId");

-- CreateIndex
CREATE INDEX "LessonLearned_severity_idx" ON "LessonLearned"("severity");

-- CreateIndex
CREATE INDEX "LessonLearned_isResolved_idx" ON "LessonLearned"("isResolved");

-- CreateIndex
CREATE UNIQUE INDEX "MethodStatement_methodCode_key" ON "MethodStatement"("methodCode");

-- CreateIndex
CREATE INDEX "MethodStatement_wbsStage_idx" ON "MethodStatement"("wbsStage");

-- CreateIndex
CREATE INDEX "MethodStatement_methodCode_idx" ON "MethodStatement"("methodCode");

-- CreateIndex
CREATE INDEX "MethodStatement_isActive_idx" ON "MethodStatement"("isActive");

-- CreateIndex
CREATE INDEX "QcTemplate_wbsStage_idx" ON "QcTemplate"("wbsStage");

-- CreateIndex
CREATE INDEX "QcTemplate_isActive_idx" ON "QcTemplate"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "KpiRecord_kpiCode_key" ON "KpiRecord"("kpiCode");

-- CreateIndex
CREATE INDEX "KpiRecord_workerId_idx" ON "KpiRecord"("workerId");

-- CreateIndex
CREATE INDEX "KpiRecord_period_idx" ON "KpiRecord"("period");

-- CreateIndex
CREATE UNIQUE INDEX "KpiRecord_workerId_period_key" ON "KpiRecord"("workerId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "ToolMaintenance_maintenanceCode_key" ON "ToolMaintenance"("maintenanceCode");

-- CreateIndex
CREATE INDEX "ToolMaintenance_toolId_idx" ON "ToolMaintenance"("toolId");

-- CreateIndex
CREATE INDEX "ToolMaintenance_scheduledDate_idx" ON "ToolMaintenance"("scheduledDate");

-- CreateIndex
CREATE INDEX "ToolMaintenance_performedDate_idx" ON "ToolMaintenance"("performedDate");

-- CreateIndex
CREATE INDEX "ToolActivity_toolId_idx" ON "ToolActivity"("toolId");

-- CreateIndex
CREATE INDEX "ToolActivity_type_idx" ON "ToolActivity"("type");

-- CreateIndex
CREATE INDEX "ToolActivity_createdAt_idx" ON "ToolActivity"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MasterTool_toolCode_key" ON "MasterTool"("toolCode");

-- CreateIndex
CREATE INDEX "MasterTool_category_idx" ON "MasterTool"("category");

-- CreateIndex
CREATE INDEX "MasterTool_isActive_idx" ON "MasterTool"("isActive");

-- CreateIndex
CREATE INDEX "MasterTool_currentCondition_idx" ON "MasterTool"("currentCondition");

-- CreateIndex
CREATE INDEX "ToolPhoto_toolId_idx" ON "ToolPhoto"("toolId");

-- CreateIndex
CREATE UNIQUE INDEX "ToolLoan_loanCode_key" ON "ToolLoan"("loanCode");

-- CreateIndex
CREATE INDEX "ToolLoan_toolId_idx" ON "ToolLoan"("toolId");

-- CreateIndex
CREATE INDEX "ToolLoan_workerId_idx" ON "ToolLoan"("workerId");

-- CreateIndex
CREATE INDEX "ToolLoan_status_idx" ON "ToolLoan"("status");

-- CreateIndex
CREATE INDEX "ToolLoan_issuedAt_idx" ON "ToolLoan"("issuedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SantraCounter_prefix_key" ON "SantraCounter"("prefix");

-- CreateIndex
CREATE UNIQUE INDEX "SiteCollectionItem_collection_title_key" ON "SiteCollectionItem"("collection", "title");

-- AddForeignKey
ALTER TABLE "WorkerAssessment" ADD CONSTRAINT "WorkerAssessment_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobAssignment" ADD CONSTRAINT "JobAssignment_rabId_fkey" FOREIGN KEY ("rabId") REFERENCES "Rab"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobAssignment" ADD CONSTRAINT "JobAssignment_methodStatementId_fkey" FOREIGN KEY ("methodStatementId") REFERENCES "MethodStatement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobAssignment" ADD CONSTRAINT "JobAssignment_responsiblePersonId_fkey" FOREIGN KEY ("responsiblePersonId") REFERENCES "Worker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobAssignment" ADD CONSTRAINT "JobAssignment_responsibleMandorId_fkey" FOREIGN KEY ("responsibleMandorId") REFERENCES "Worker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutionLog" ADD CONSTRAINT "ExecutionLog_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "JobAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutionLog" ADD CONSTRAINT "ExecutionLog_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutionLog" ADD CONSTRAINT "ExecutionLog_dailyReportId_fkey" FOREIGN KEY ("dailyReportId") REFERENCES "DailyReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutionPhoto" ADD CONSTRAINT "ExecutionPhoto_logId_fkey" FOREIGN KEY ("logId") REFERENCES "ExecutionLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QcRecord" ADD CONSTRAINT "QcRecord_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "JobAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QcRecord" ADD CONSTRAINT "QcRecord_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QcRecord" ADD CONSTRAINT "QcRecord_methodCode_fkey" FOREIGN KEY ("methodCode") REFERENCES "MethodStatement"("methodCode") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QcRecord" ADD CONSTRAINT "QcRecord_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "QcTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QcRecord" ADD CONSTRAINT "QcRecord_reworkOfId_fkey" FOREIGN KEY ("reworkOfId") REFERENCES "QcRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QcPhoto" ADD CONSTRAINT "QcPhoto_qcId_fkey" FOREIGN KEY ("qcId") REFERENCES "QcRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QcApprovalLog" ADD CONSTRAINT "QcApprovalLog_qcId_fkey" FOREIGN KEY ("qcId") REFERENCES "QcRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonLearned" ADD CONSTRAINT "LessonLearned_qcRecordId_fkey" FOREIGN KEY ("qcRecordId") REFERENCES "QcRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QcTemplate" ADD CONSTRAINT "QcTemplate_methodCode_fkey" FOREIGN KEY ("methodCode") REFERENCES "MethodStatement"("methodCode") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KpiRecord" ADD CONSTRAINT "KpiRecord_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToolMaintenance" ADD CONSTRAINT "ToolMaintenance_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "MasterTool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToolActivity" ADD CONSTRAINT "ToolActivity_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "MasterTool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasterTool" ADD CONSTRAINT "MasterTool_personalOwnerId_fkey" FOREIGN KEY ("personalOwnerId") REFERENCES "Worker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToolPhoto" ADD CONSTRAINT "ToolPhoto_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "MasterTool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToolLoan" ADD CONSTRAINT "ToolLoan_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "MasterTool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToolLoan" ADD CONSTRAINT "ToolLoan_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;
