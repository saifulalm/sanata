-- ============================================================
-- SANTARA QC Enhancement: Method Statement & WBS Integration
-- Migration: 20260829000000
-- Description: Add MethodStatement, QcTemplate, and extended QcRecord fields
-- Following Santara Digital QC Flow PDF specifications
-- ============================================================

-- CreateEnum for WBS Stage (18 stages from PDF)
CREATE TYPE "WbsStage" AS ENUM (
  'PRE_CONSTRUCTION',
  'SITE_PREPARATION',
  'EARTHWORK',
  'FOUNDATION',
  'STRUCTURE',
  'MASONRY',
  'ROOF',
  'MEP',
  'WATERPROOFING',
  'PLASTER_SCREED',
  'FLOOR_WALL_FINISH',
  'CEILING',
  'DOORS_WINDOWS',
  'PAINTING',
  'EXTERNAL_WORKS',
  'TESTING_COMMISSIONING',
  'SNAGGING',
  'HANDOVER'
);

-- CreateEnum for Check Type (Pre-check, Post-check, Final)
CREATE TYPE "CheckType" AS ENUM ('PRE_CHECK', 'POST_CHECK', 'FINAL_CHECK');

-- CreateEnum for QcSeverity (criticality level)
CREATE TYPE "QcSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- ============================================================
-- MethodStatement Table
-- Master method statements per WBS stage following PDF Page 6 template
-- ============================================================
CREATE TABLE "MethodStatement" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "methodCode" TEXT NOT NULL UNIQUE,
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

    CONSTRAINT "MethodStatement_revision_positive" CHECK ("revision" > 0)
);

-- ============================================================
-- QcTemplate Table
-- Checklist templates per WBS stage following PDF Page 4 format
-- ============================================================
CREATE TABLE "QcTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "wbsStage" "WbsStage" NOT NULL,
    "methodCode" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    -- Items stored as JSONB array: [{itemDesc, criteria, tolerance, isMandatory, order}]
    "items" JSONB NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- ============================================================
-- Extend QcRecord with QC Flow requirements
-- ============================================================
ALTER TABLE "QcRecord" ADD COLUMN IF NOT EXISTS "wbsStage" "WbsStage";
ALTER TABLE "QcRecord" ADD COLUMN IF NOT EXISTS "methodCode" TEXT;
ALTER TABLE "QcRecord" ADD COLUMN IF NOT EXISTS "checkType" "CheckType" DEFAULT 'POST_CHECK';
ALTER TABLE "QcRecord" ADD COLUMN IF NOT EXISTS "templateId" TEXT;
ALTER TABLE "QcRecord" ADD COLUMN IF NOT EXISTS "holdPoint" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "QcRecord" ADD COLUMN IF NOT EXISTS "isReleased" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "QcRecord" ADD COLUMN IF NOT EXISTS "releasedById" TEXT;
ALTER TABLE "QcRecord" ADD COLUMN IF NOT EXISTS "releasedAt" TIMESTAMP(3);
ALTER TABLE "QcRecord" ADD COLUMN IF NOT EXISTS "latitude" DECIMAL(10, 7);
ALTER TABLE "QcRecord" ADD COLUMN IF NOT EXISTS "longitude" DECIMAL(10, 7);
ALTER TABLE "QcRecord" ADD COLUMN IF NOT EXISTS "weather" VARCHAR(20);
ALTER TABLE "QcRecord" ADD COLUMN IF NOT EXISTS "temperature" DECIMAL(5, 2);
ALTER TABLE "QcRecord" ADD COLUMN IF NOT EXISTS "photosCount" INTEGER DEFAULT 0;
ALTER TABLE "QcRecord" ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- ============================================================
-- QcApprovalLog Table for Multi-level approval
-- ============================================================
CREATE TABLE "QcApprovalLog" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "qcId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "approverName" TEXT,
    "approverRole" VARCHAR(50),
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- LessonLearned Table
-- Continuous improvement from rework data
-- ============================================================
CREATE TABLE "LessonLearned" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "wbsStage" "WbsStage",
    "qcRecordId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rootCause" TEXT,
    "correctiveAction" TEXT,
    "preventiveAction" TEXT,
    "severity" "QcSeverity" DEFAULT 'MEDIUM',
    "occurredAt" TIMESTAMP(3),
    "createdById" TEXT,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- ============================================================
-- Extend JobAssignment with MethodStatement reference
-- ============================================================
ALTER TABLE "JobAssignment" ADD COLUMN IF NOT EXISTS "wbsStage" "WbsStage";
ALTER TABLE "JobAssignment" ADD COLUMN IF NOT EXISTS "methodStatementId" TEXT;
ALTER TABLE "JobAssignment" ADD COLUMN IF NOT EXISTS "methodCode" TEXT;
ALTER TABLE "JobAssignment" ADD COLUMN IF NOT EXISTS "acceptanceCriteria" TEXT;
ALTER TABLE "JobAssignment" ADD COLUMN IF NOT EXISTS "tolerance" TEXT;
ALTER TABLE "JobAssignment" ADD COLUMN IF NOT EXISTS "evidenceRequirement" TEXT[];

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS "MethodStatement_wbsStage_idx" ON "MethodStatement"("wbsStage");
CREATE INDEX IF NOT EXISTS "MethodStatement_methodCode_idx" ON "MethodStatement"("methodCode");
CREATE INDEX IF NOT EXISTS "MethodStatement_isActive_idx" ON "MethodStatement"("isActive");

CREATE INDEX IF NOT EXISTS "QcTemplate_wbsStage_idx" ON "QcTemplate"("wbsStage");
CREATE INDEX IF NOT EXISTS "QcTemplate_isActive_idx" ON "QcTemplate"("isActive");

CREATE INDEX IF NOT EXISTS "QcRecord_wbsStage_idx" ON "QcRecord"("wbsStage");
CREATE INDEX IF NOT EXISTS "QcRecord_methodCode_idx" ON "QcRecord"("methodCode");
CREATE INDEX IF NOT EXISTS "QcRecord_checkType_idx" ON "QcRecord"("checkType");
CREATE INDEX IF NOT EXISTS "QcRecord_holdPoint_idx" ON "QcRecord"("holdPoint");
CREATE INDEX IF NOT EXISTS "QcRecord_isReleased_idx" ON "QcRecord"("isReleased");
CREATE INDEX IF NOT EXISTS "QcRecord_weather_idx" ON "QcRecord"("weather");

CREATE INDEX IF NOT EXISTS "QcApprovalLog_qcId_idx" ON "QcApprovalLog"("qcId");
CREATE INDEX IF NOT EXISTS "QcApprovalLog_approverId_idx" ON "QcApprovalLog"("approverId");

CREATE INDEX IF NOT EXISTS "LessonLearned_wbsStage_idx" ON "LessonLearned"("wbsStage");
CREATE INDEX IF NOT EXISTS "LessonLearned_qcRecordId_idx" ON "LessonLearned"("qcRecordId");
CREATE INDEX IF NOT EXISTS "LessonLearned_severity_idx" ON "LessonLearned"("severity");
CREATE INDEX IF NOT EXISTS "LessonLearned_isResolved_idx" ON "LessonLearned"("isResolved");

CREATE INDEX IF NOT EXISTS "JobAssignment_methodStatementId_idx" ON "JobAssignment"("methodStatementId");

-- ============================================================
-- Foreign Keys
-- ============================================================
ALTER TABLE "QcTemplate" ADD CONSTRAINT "QcTemplate_methodCode_fkey"
    FOREIGN KEY ("methodCode") REFERENCES "MethodStatement"("methodCode") ON DELETE SET NULL;

ALTER TABLE "QcRecord" ADD CONSTRAINT "QcRecord_methodStatementId_fkey"
    FOREIGN KEY ("templateId") REFERENCES "QcTemplate"("id") ON DELETE SET NULL;

ALTER TABLE "QcRecord" ADD CONSTRAINT "QcRecord_releasedById_fkey"
    FOREIGN KEY ("releasedById") REFERENCES "User"("id") ON DELETE SET NULL;

ALTER TABLE "QcApprovalLog" ADD CONSTRAINT "QcApprovalLog_qcId_fkey"
    FOREIGN KEY ("qcId") REFERENCES "QcRecord"("id") ON DELETE CASCADE;

ALTER TABLE "LessonLearned" ADD CONSTRAINT "LessonLearned_qcRecordId_fkey"
    FOREIGN KEY ("qcRecordId") REFERENCES "QcRecord"("id") ON DELETE SET NULL;

ALTER TABLE "JobAssignment" ADD CONSTRAINT "JobAssignment_methodStatementId_fkey"
    FOREIGN KEY ("methodStatementId") REFERENCES "MethodStatement"("id") ON DELETE SET NULL;

-- ============================================================
-- Insert Default Data: 18 WBS Stage MethodStatements
-- Following Santara Digital QC Flow PDF Page 2 specifications
-- ============================================================

-- Pre-Construction (GEN-001)
INSERT INTO "MethodStatement" ("id", "methodCode", "wbsStage", "workItem", "scope", "reference", "acceptanceCriteria", "holdPoint", "responsibleRoles", "createdAt", "updatedAt")
VALUES
(gen_random_uuid()::text, 'GEN-001', 'PRE_CONSTRUCTION', 'Pre-Construction Preparation',
 'Shop drawing, material approval, penentuan direksi keet, informasi proyek',
 'Kontrak, latest revision drawings',
 'Documents approved, latest revision used, diagram alur, struktur organisasi',
 false, ARRAY['Project Manager', 'Site Engineer', 'Administrasi Proyek'], CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Site Preparation (CIV-001)
INSERT INTO "MethodStatement" ("id", "methodCode", "wbsStage", "workItem", "scope", "reference", "acceptanceCriteria", "holdPoint", "responsibleRoles", "createdAt", "updatedAt")
VALUES
(gen_random_uuid()::text, 'CIV-001', 'SITE_PREPARATION', 'Site Preparation & Bouwplank',
 'Topografi, superimpose gambar ke Site existing dengan total station dan autolevel',
 'Spesifikasi proyek, benchmark valid',
 'Grid & elevation checked, sesuai drawing / tolerance proyek',
 true, ARRAY['Site Engineer', 'Ass Site Engineer'], CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Earthwork (CIV-002)
INSERT INTO "MethodStatement" ("id", "methodCode", "wbsStage", "workItem", "scope", "reference", "acceptanceCriteria", "holdPoint", "responsibleRoles", "createdAt", "updatedAt")
VALUES
(gen_random_uuid()::text, 'CIV-002', 'EARTHWORK', 'Earthwork - Galian, Urugan, Pemadatan',
 'Layering & compaction, area clear',
 'Spesifikasi teknis, test result',
 'Sesuai spesifikasi / test, layering & compaction verified',
 true, ARRAY['Site Engineer', 'Mandor'], CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Foundation (STR-001)
INSERT INTO "MethodStatement" ("id", "methodCode", "wbsStage", "workItem", "scope", "reference", "acceptanceCriteria", "holdPoint", "responsibleRoles", "createdAt", "updatedAt")
VALUES
(gen_random_uuid()::text, 'STR-001', 'FOUNDATION', 'Foundation - Pondasi, Pilecap, Footing',
 'Rebar/formwork ready, rebar, cover, dimension check',
 'Structural drawing, concrete spec',
 'Sesuai structural drawing, pour approval required',
 true, ARRAY['Site Engineer', 'QC External', 'Arsitek External'], CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Structure (STR-002)
INSERT INTO "MethodStatement" ("id", "methodCode", "wbsStage", "workItem", "scope", "reference", "acceptanceCriteria", "holdPoint", "responsibleRoles", "createdAt", "updatedAt")
VALUES
(gen_random_uuid()::text, 'STR-002', 'STRUCTURE', 'Structure - Kolom, Balok, Slab',
 'Formwork/rebar ready, embed, concrete pour',
 'Drawing + concrete spec',
 'Sesuai drawing + concrete spec, pour approval required',
 true, ARRAY['Site Engineer', 'QC External', 'Arsitek External'], CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Masonry (ARC-001)
INSERT INTO "MethodStatement" ("id", "methodCode", "wbsStage", "workItem", "scope", "reference", "acceptanceCriteria", "holdPoint", "responsibleRoles", "createdAt", "updatedAt")
VALUES
(gen_random_uuid()::text, 'ARC-001', 'MASONRY', 'Masonry - Bata, Block, Partition',
 'Material approved, layout, plumb, joint, ties',
 'Shop drawing, project tolerance',
 'Layout, plumb, joint, ties sesuai project tolerance',
 true, ARRAY['Site Engineer', 'Mandor'], CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Roof (ARC-002)
INSERT INTO "MethodStatement" ("id", "methodCode", "wbsStage", "workItem", "scope", "reference", "acceptanceCriteria", "holdPoint", "responsibleRoles", "createdAt", "updatedAt")
VALUES
(gen_random_uuid()::text, 'ARC-002', 'ROOF', 'Roof - Rangka, Waterproofing, Roof Cover',
 'Substrate ready, slope, fixing, flashing',
 'Drawing + waterproofing spec',
 'No leak + drawing compliance, slope verified',
 true, ARRAY['Site Engineer', 'Mandor'], CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- MEP (MEP-001)
INSERT INTO "MethodStatement" ("id", "methodCode", "wbsStage", "workItem", "scope", "reference", "acceptanceCriteria", "holdPoint", "responsibleRoles", "createdAt", "updatedAt")
VALUES
(gen_random_uuid()::text, 'MEP-001', 'MEP', 'MEP - Electrical, Plumbing, HVAC',
 'Shop drawing approved, routing, support, testing',
 'Code/spec + test result',
 'Routing, support, testing sesuai code/spec',
 true, ARRAY['Site Engineer', 'MEP Engineer'], CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Waterproofing (ARC-003)
INSERT INTO "MethodStatement" ("id", "methodCode", "wbsStage", "workItem", "scope", "reference", "acceptanceCriteria", "holdPoint", "responsibleRoles", "createdAt", "updatedAt")
VALUES
(gen_random_uuid()::text, 'ARC-003', 'WATERPROOFING', 'Waterproofing - Toilet, Roof, Balcony',
 'Substrate ready, application & detailing',
 'Approved test method, flood test',
 'Flood test / approved test, no leak',
 true, ARRAY['Site Engineer', 'QC External'], CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Plaster & Screed (ARC-004)
INSERT INTO "MethodStatement" ("id", "methodCode", "wbsStage", "workItem", "scope", "reference", "acceptanceCriteria", "holdPoint", "responsibleRoles", "createdAt", "updatedAt")
VALUES
(gen_random_uuid()::text, 'ARC-004', 'PLASTER_SCREED', 'Plaster & Screed',
 'Base ready, thickness, level, curing',
 'Flatness / thickness spec',
 'Thickness, level sesuai spec, curing verified',
 false, ARRAY['Site Engineer', 'Mandor'], CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Floor & Wall Finish (FIN-001)
INSERT INTO "MethodStatement" ("id", "methodCode", "wbsStage", "workItem", "scope", "reference", "acceptanceCriteria", "holdPoint", "responsibleRoles", "createdAt", "updatedAt")
VALUES
(gen_random_uuid()::text, 'FIN-001', 'FLOOR_WALL_FINISH', 'Floor & Wall Finish - Tile, Stone, Specialty',
 'Sample approved, layout, adhesive, joint',
 'Pattern + flatness + hollow limit spec',
 'Pattern + flatness + hollow limit sesuai spec',
 true, ARRAY['Site Engineer', 'Arsitek External', 'QC External'], CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Ceiling (FIN-002)
INSERT INTO "MethodStatement" ("id", "methodCode", "wbsStage", "workItem", "scope", "reference", "acceptanceCriteria", "holdPoint", "responsibleRoles", "createdAt", "updatedAt")
VALUES
(gen_random_uuid()::text, 'FIN-002', 'CEILING', 'Ceiling - Gypsum, Panel, Acoustic',
 'MEP above complete, frame, level, access panel',
 'Level + joint quality spec',
 'Level + joint quality sesuai spec',
 false, ARRAY['Site Engineer', 'Mandor'], CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Doors & Windows (FIN-003)
INSERT INTO "MethodStatement" ("id", "methodCode", "wbsStage", "workItem", "scope", "reference", "acceptanceCriteria", "holdPoint", "responsibleRoles", "createdAt", "updatedAt")
VALUES
(gen_random_uuid()::text, 'FIN-003', 'DOORS_WINDOWS', 'Doors & Windows - Frame, Glass, Hardware',
 'Opening correct, anchor, sealant, operation',
 'Operation + watertightness spec',
 'Opening correct, anchor, sealant, operation sesuai spec',
 true, ARRAY['Site Engineer', 'Arsitek External'], CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Painting (FIN-004)
INSERT INTO "MethodStatement" ("id", "methodCode", "wbsStage", "workItem", "scope", "reference", "acceptanceCriteria", "holdPoint", "responsibleRoles", "createdAt", "updatedAt")
VALUES
(gen_random_uuid()::text, 'FIN-004', 'PAINTING', 'Painting - Primer, Top Coat',
 'Surface ready, preparation, coats, drying',
 'Uniformity + color + adhesion spec',
 'Uniformity + color + adhesion sesuai spec',
 false, ARRAY['Site Engineer', 'Mandor'], CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- External Works (EXT-001)
INSERT INTO "MethodStatement" ("id", "methodCode", "wbsStage", "workItem", "scope", "reference", "acceptanceCriteria", "holdPoint", "responsibleRoles", "createdAt", "updatedAt")
VALUES
(gen_random_uuid()::text, 'EXT-001', 'EXTERNAL_WORKS', 'External Works - Drainage, Landscape, Paving',
 'Levels checked, slope, joints, drainage',
 'No ponding + approved layout',
 'Slope, joints, drainage sesuai spec, no ponding',
 true, ARRAY['Site Engineer', 'QC External'], CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Testing & Commissioning (T&C-001)
INSERT INTO "MethodStatement" ("id", "methodCode", "wbsStage", "workItem", "scope", "reference", "acceptanceCriteria", "holdPoint", "responsibleRoles", "createdAt", "updatedAt")
VALUES
(gen_random_uuid()::text, 'T&C-001', 'TESTING_COMMISSIONING', 'Testing & Commissioning - MEP Functional Test',
 'Installation complete, functional testing',
 'System design spec',
 'System performs as designed, functional test passed',
 true, ARRAY['MEP Engineer', 'QC External', 'Owner'], CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Snagging (QA-001)
INSERT INTO "MethodStatement" ("id", "methodCode", "wbsStage", "workItem", "scope", "reference", "acceptanceCriteria", "holdPoint", "responsibleRoles", "createdAt", "updatedAt")
VALUES
(gen_random_uuid()::text, 'QA-001', 'SNAGGING', 'Snagging - Defect / Punch List',
 'All works substantially complete, room-by-room inspection',
 'Zero critical defects spec',
 'Zero critical defects, all minor defects listed',
 true, ARRAY['Site Engineer', 'QC External', 'Owner'], CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Handover (DOC-001)
INSERT INTO "MethodStatement" ("id", "methodCode", "wbsStage", "workItem", "scope", "reference", "acceptanceCriteria", "holdPoint", "responsibleRoles", "createdAt", "updatedAt")
VALUES
(gen_random_uuid()::text, 'DOC-001', 'HANDOVER', 'Handover - As-built, O&M, Warranty',
 'Documents complete, final verification',
 'Complete handover package requirements',
 'Complete handover package, semua laporan QC + foto, kepuasan Klien',
 true, ARRAY['Project Manager', 'Administrasi Teknik', 'Owner', 'Director Project'], CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ============================================================
-- Insert Default QC Templates for common WBS stages
-- Following PDF Page 4 format
-- ============================================================

-- Masonry QC Template (ARC-001)
INSERT INTO "QcTemplate" ("id", "wbsStage", "methodCode", "name", "description", "items", "createdAt", "updatedAt")
VALUES (
    gen_random_uuid()::text,
    'MASONRY',
    'ARC-001',
    'QC Checklist Pasangan Bata/Dinding',
    'Template checklist QC untuk pekerjaan pasangan bata mengikuti Method ARC-001',
    '[
        {"itemDesc": "Material bata sesuai approved sample", "criteria": "Jenis/ukuran sesuai approval", "tolerance": "100%", "isMandatory": true, "order": 1},
        {"itemDesc": "Permukaan & area kerja siap", "criteria": "Bersih, bebas material pengganggu", "tolerance": "100%", "isMandatory": true, "order": 2},
        {"itemDesc": "Layout dinding ditandai", "criteria": "Posisi sesuai grid/dimensi", "tolerance": "mm", "isMandatory": true, "order": 3},
        {"itemDesc": "Arah pasangan & kelurusan", "criteria": "Sesuai tolerance proyek", "tolerance": "mm", "isMandatory": true, "order": 4},
        {"itemDesc": "Ketebalan/joint pasangan", "criteria": "Sesuai spesifikasi", "tolerance": "mm", "isMandatory": false, "order": 5},
        {"itemDesc": "Pengikat ke struktur", "criteria": "Sesuai detail approved", "tolerance": "100%", "isMandatory": true, "order": 6},
        {"itemDesc": "Bukaan pintu/jendela", "criteria": "Dimensi & posisi sesuai drawing", "tolerance": "mm", "isMandatory": true, "order": 7},
        {"itemDesc": "Plumb & level", "criteria": "Dalam tolerance", "tolerance": "mm", "isMandatory": true, "order": 8},
        {"itemDesc": "Tidak ada kerusakan / retak awal", "criteria": "Tidak ada defect kritis", "tolerance": "Visual", "isMandatory": true, "order": 9}
    ]'::jsonb,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Foundation QC Template (STR-001)
INSERT INTO "QcTemplate" ("id", "wbsStage", "methodCode", "name", "description", "items", "createdAt", "updatedAt")
VALUES (
    gen_random_uuid()::text,
    'FOUNDATION',
    'STR-001',
    'QC Checklist Pondasi',
    'Template checklist QC untuk pekerjaan pondasi, pilecap, dan footing',
    '[
        {"itemDesc": "Rebar ready & sesuai drawing", "criteria": "Sesuai structural drawing", "tolerance": "mm", "isMandatory": true, "order": 1},
        {"itemDesc": "Cover/spasi besi", "criteria": "Sesuai spesifikasi", "tolerance": "mm", "isMandatory": true, "order": 2},
        {"itemDesc": "Dimension/ukuran", "criteria": "Sesuai drawing", "tolerance": "mm", "isMandatory": true, "order": 3},
        {"itemDesc": "Formwork siap", "criteria": "Kokoh & aligned", "tolerance": "mm", "isMandatory": true, "order": 4},
        {"itemDesc": "Cleanliness", "criteria": "Bebas kotoran", "tolerance": "100%", "isMandatory": true, "order": 5},
        {"itemDesc": "Waterstop/penyekat", "criteria": "Terpasang sesuai detail", "tolerance": "100%", "isMandatory": false, "order": 6}
    ]'::jsonb,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Structure QC Template (STR-002)
INSERT INTO "QcTemplate" ("id", "wbsStage", "methodCode", "name", "description", "items", "createdAt", "updatedAt")
VALUES (
    gen_random_uuid()::text,
    'STRUCTURE',
    'STR-002',
    'QC Checklist Structure Beton',
    'Template checklist QC untuk pekerjaan kolom, balok, dan slab',
    '[
        {"itemDesc": "Formwork/rebar ready", "criteria": "Sesuai drawing", "tolerance": "mm", "isMandatory": true, "order": 1},
        {"itemDesc": "Rebar check", "criteria": "Sesuai structural drawing", "tolerance": "mm", "isMandatory": true, "order": 2},
        {"itemDesc": "Embed/penyelupan", "criteria": "Posisi sesuai drawing", "tolerance": "mm", "isMandatory": true, "order": 3},
        {"itemDesc": "Concrete specification", "criteria": "Sesuai concrete spec", "tolerance": "100%", "isMandatory": true, "order": 4},
        {"itemDesc": "Slump test", "criteria": "Sesuai spec", "tolerance": "mm", "isMandatory": true, "order": 5},
        {"itemDesc": "Curing procedure", "criteria": "Sesuai procedure", "tolerance": "100%", "isMandatory": true, "order": 6}
    ]'::jsonb,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Plaster QC Template (ARC-004)
INSERT INTO "QcTemplate" ("id", "wbsStage", "methodCode", "name", "description", "items", "createdAt", "updatedAt")
VALUES (
    gen_random_uuid()::text,
    'PLASTER_SCREED',
    'ARC-004',
    'QC Checklist Plester & Screed',
    'Template checklist QC untuk pekerjaan plesteran dan screed',
    '[
        {"itemDesc": "Base/surface ready", "criteria": "Bersih & kering", "tolerance": "100%", "isMandatory": true, "order": 1},
        {"itemDesc": "Thickness/tebal", "criteria": "Sesuai spec", "tolerance": "mm", "isMandatory": true, "order": 2},
        {"itemDesc": "Level/kadar", "criteria": "Sesuai tolerance", "tolerance": "mm", "isMandatory": true, "order": 3},
        {"itemDesc": "Flatness", "criteria": "Sesuai spec", "tolerance": "mm", "isMandatory": true, "order": 4},
        {"itemDesc": "Curing", "criteria": "Sesuai procedure", "tolerance": "100%", "isMandatory": true, "order": 5},
        {"itemDesc": "No cracking", "criteria": "Tidak ada retak", "tolerance": "Visual", "isMandatory": true, "order": 6}
    ]'::jsonb,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Floor Finish QC Template (FIN-001)
INSERT INTO "QcTemplate" ("id", "wbsStage", "methodCode", "name", "description", "items", "createdAt", "updatedAt")
VALUES (
    gen_random_uuid()::text,
    'FLOOR_WALL_FINISH',
    'FIN-001',
    'QC Checklist Floor & Wall Finish',
    'Template checklist QC untuk pekerjaan finishing lantai dan dinding',
    '[
        {"itemDesc": "Sample approved", "criteria": "Sesuai approval", "tolerance": "100%", "isMandatory": true, "order": 1},
        {"itemDesc": "Layout/tagging", "criteria": "Sesuai drawing", "tolerance": "mm", "isMandatory": true, "order": 2},
        {"itemDesc": "Adhesive/perekat", "criteria": "Sesuai spec", "tolerance": "100%", "isMandatory": true, "order": 3},
        {"itemDesc": "Joint/grout lines", "criteria": "Rata & sama", "tolerance": "mm", "isMandatory": true, "order": 4},
        {"itemDesc": "Pattern", "criteria": "Sesuai spec", "tolerance": "100%", "isMandatory": true, "order": 5},
        {"itemDesc": "Flatness", "criteria": "Sesuai spec", "tolerance": "mm", "isMandatory": true, "order": 6},
        {"itemDesc": "Hollow limit", "criteria": "Max tolerance", "tolerance": "%", "isMandatory": true, "order": 7}
    ]'::jsonb,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
