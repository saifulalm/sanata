// SANTRA Full Database Seeder
// Fills all gaps in the Sanata Construction Management System
// Run with: npx tsx prisma/seed-santra-full.ts

import { PrismaClient, ProjectRole, Weather, WorkerStatus, WorkerGrade, 
         AssignmentStatus, QcResult, ToolCondition, ToolOwner, LoanStatus,
         WbsStage, CheckType, QcSeverity, SubmissionType, SubmissionStatus,
         LetterType, LetterStatus, BillingStatus, LogbookCategory, LogbookSeverity,
         MemoDirection, MemoCategory, MemoStatus, ProgressStatus, MaintenanceType } from '@prisma/client';

const prisma = new PrismaClient();
// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals: number = 2): number {
  const val = Math.random() * (max - min) + min;
  return Number(val.toFixed(decimals));
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomElements<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateCode(prefix: string, seq: number): string {
  return `${prefix}-${String(seq).padStart(4, '0')}`;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Indonesian location coordinates
const LOCATIONS = {
  jakarta: { lat: -6.2088, lng: 106.8456 },
  bandung: { lat: -6.9175, lng: 107.6191 },
  surabaya: { lat: -7.2575, lng: 112.7521 },
  bekasi: { lat: -6.2389, lng: 106.9756 },
  tangerang: { lat: -6.1781, lng: 106.63 },
  depok: { lat: -6.4025, lng: 106.7942 },
  bogor: { lat: -6.5950, lng: 106.8166 },
  cikarang: { lat: -6.2350, lng: 107.2390 },
};

// Weather types
const WEATHER_TYPES = [Weather.CERAH, Weather.BERAWAN, Weather.GERIMIS, Weather.HUJAN, Weather.HUJAN_LEBAT];

// Project roles available for workers
const PROJECT_ROLES: ProjectRole[] = [
  ProjectRole.DIREKTUR_UTAMA,
  ProjectRole.DIREKTUR,
  ProjectRole.MANAGER_PROYEK,
  ProjectRole.SITE_MANAGER,
  ProjectRole.PIMPINAN_PROYEK,
  ProjectRole.KEPALA_TUKANG,
  ProjectRole.TUKANG_BATU,
  ProjectRole.TUKANG_KAYU,
  ProjectRole.TUKANG_BESI,
  ProjectRole.OPERATOR,
  ProjectRole.MANDOR,
  ProjectRole.PEKERJA,
  ProjectRole.STAF,
];

// WBS Stages
const WBS_STAGES: WbsStage[] = [
  WbsStage.PRE_CONSTRUCTION,
  WbsStage.SITE_PREPARATION,
  WbsStage.EARTHWORK,
  WbsStage.FOUNDATION,
  WbsStage.STRUCTURE,
  WbsStage.MASONRY,
  WbsStage.ROOF,
  WbsStage.MEP,
  WbsStage.WATERPROOFING,
  WbsStage.PLASTER_SCREED,
  WbsStage.FLOOR_WALL_FINISH,
  WbsStage.CEILING,
  WbsStage.DOORS_WINDOWS,
  WbsStage.PAINTING,
  WbsStage.EXTERNAL_WORKS,
  WbsStage.TESTING_COMMISSIONING,
  WbsStage.SNAGGING,
  WbsStage.HANDOVER,
];

// Logbook categories
const LOGBOOK_CATEGORIES: LogbookCategory[] = [
  LogbookCategory.KUNJUNGAN_CLIENT,
  LogbookCategory.KUNJUNGAN_KONSULTAN,
  LogbookCategory.INSTRUKSI_LAPANGAN,
  LogbookCategory.KEAMANAN,
  LogbookCategory.KESALAHAN_KERJA,
  LogbookCategory.KECELAKAAN_KERJA,
  LogbookCategory.KERUSAKAN_ALAT,
  LogbookCategory.GANGGUAN_CUACA,
  LogbookCategory.GANGGUAN_WARGA,
  LogbookCategory.LAINNYA,
];

const LOGBOOK_SEVERITIES: LogbookSeverity[] = [
  LogbookSeverity.INFO,
  LogbookSeverity.RINGAN,
  LogbookSeverity.SEDANG,
  LogbookSeverity.BERAT,
  LogbookSeverity.KRITIS,
];

const MEMO_CATEGORIES: MemoCategory[] = [
  MemoCategory.KOMPLAIN,
  MemoCategory.INSTRUKSI,
  MemoCategory.TEGURAN,
  MemoCategory.PERMINTAAN_INFO,
  MemoCategory.KLARIFIKASI,
  MemoCategory.APPROVAL,
  MemoCategory.ADDENDUM,
  MemoCategory.LAINNYA,
];
// ============================================================================
// DATA ARRAYS
// ============================================================================

// Indonesian Worker Names
const WORKER_FIRST_NAMES = [
  'Ahmad', 'Budi', 'Dedi', 'Eko', 'Fajar', 'Gunawan', 'Hadi', 'Indra', 'Joko', 'Kurniawan',
  'Lukman', 'Muhammad', 'Naufal', 'Owena', 'Panji', 'Queensy', 'Rizki', 'Sandi', 'Taufik', 'Udin',
  'Vino', 'Wahyu', 'Yusuf', 'Zainal', 'Abdul', 'Bachtiar', 'Candra', 'Dimas', 'Eri', 'Feri',
  'Gilang', 'Hasan', 'Irfan', 'Jasman', 'Krisna', 'Lana', 'Maman', 'Nanda', 'Oscar', 'Putra',
  'Qori', 'Rama', 'Sopian', 'Tedi', 'Umar', 'Viky', 'Wawan', 'Yogi', 'Zaki', 'Adi',
  'Bayu', 'Cahyono', 'Darmawan', 'Endra', 'Firmansyah', 'Galang', 'Hafiz', 'Ibrahim', 'Jamil', 'Khaidir',
  'Lisna', 'Mila', 'Nia', 'Octavia', 'Putri', 'Qonitah', 'Rina', 'Sari', 'Tika', 'Ummu',
  'Vina', 'Wati', 'Yani', 'Zahra', 'Anisa', 'Bella', 'Citra', 'Dewi', 'Euis', 'Fitri'
];

const WORKER_LAST_NAMES = [
  'Santoso', 'Wijaya', 'Kusuma', 'Pratama', 'Nugroho', 'Saputra', 'Wibowo', 'Setiawan', 'Permana', 'Rahman',
  'Hidayat', 'Fauzi', 'Gunawan', 'Hakim', 'Irawan', 'Jaya', 'Kurniawan', 'Laksono', 'Mahmud', 'Nasution',
  'Oktavian', 'Purnomo', 'Qayyum', 'Ramadhan', 'Sutedja', 'Tjandra', 'Ulfah', 'Vallentino', 'Wijayanto', 'Yusuf',
  'Zulkarnain', 'Abdullah', 'Bakri', 'Cahyadi', 'Darmadi', 'Effendi', 'Fachrozi', 'Ghani', 'Halim', 'Ibrahim'
];

// Tools data
interface ToolData {
  name: string;
  category: string;
  trade?: string;
  brand?: string;
}

const MASTER_TOOLS_DATA: ToolData[] = [
  // Measurement tools
  { name: 'Theodolite Sokkia CX-105', category: 'measurement', trade: 'Surveyor', brand: 'Sokkia' },
  { name: 'Total Station Topcon GTS-102N', category: 'measurement', trade: 'Surveyor', brand: 'Topcon' },
  { name: 'GPS Geodetic Trimble R8', category: 'measurement', trade: 'Surveyor', brand: 'Trimble' },
  { name: 'Waterpass Leica NA724', category: 'measurement', trade: 'Surveyor', brand: 'Leica' },
  { name: 'Total Station Leica TS16', category: 'measurement', trade: 'Surveyor', brand: 'Leica' },
  { name: 'Meteran 50m Stanley', category: 'measurement', trade: 'General', brand: 'Stanley' },
  { name: 'Meteran 5m Pro', category: 'measurement', trade: 'General', brand: 'Tajima' },
  { name: 'Penggaris Baja 100cm', category: 'measurement', trade: 'General', brand: 'Krisbow' },
  { name: 'Clinometer Digital', category: 'measurement', trade: 'Surveyor', brand: 'Suunto' },
  { name: 'GPS Handheld Garmin 64s', category: 'measurement', trade: 'Surveyor', brand: 'Garmin' },
  // Safety equipment
  { name: 'Helm Safety Kuning Pro', category: 'safety', brand: 'MSA' },
  { name: 'Rompi Safety Orange', category: 'safety', brand: 'Yoshino' },
  { name: 'Sepatu Safety Dranger', category: 'safety', brand: 'Dranger' },
  { name: 'Sarung Tangan Las', category: 'safety', brand: 'KSB' },
  { name: 'Kacamata Safety Anti UV', category: 'safety', brand: '3M' },
  { name: 'Ear Plug 3M', category: 'safety', brand: '3M' },
  { name: 'Masker N95 3M', category: 'safety', brand: '3M' },
  { name: 'Full Body Harness', category: 'safety', brand: 'Miller' },
  { name: 'Tangga Aluminium 6m', category: 'safety', brand: 'Wisen' },
  { name: 'Tali Pengaman 15m', category: 'safety', brand: 'Petzl' },
  // Equipment
  { name: 'Concrete Mixer 350L', category: 'equipment', trade: 'Pekerja', brand: 'Krisbow' },
  { name: 'Vibrator Concrete', category: 'equipment', trade: 'Pekerja', brand: 'Makita' },
  { name: 'Bar Cutter 42 inci Maxpro', category: 'equipment', trade: 'Tukang Besi', brand: 'Maxpro' },
  { name: 'Bar Bending Machine', category: 'equipment', trade: 'Tukang Besi', brand: 'Mayer' },
  { name: 'Welding Machine 300A', category: 'equipment', trade: 'Tukang Besi', brand: 'Lincoln' },
  { name: 'Compressor 250cfm', category: 'equipment', trade: 'Operator', brand: 'Ingersoll' },
  { name: 'Concrete Pump Trailer', category: 'equipment', trade: 'Operator', brand: 'Putzmeister' },
  { name: 'Tower Crane 5 Ton', category: 'equipment', trade: 'Operator', brand: 'Potain' },
  { name: 'Excavator PC200', category: 'equipment', trade: 'Operator', brand: 'Komatsu' },
  { name: 'Dump Truck 6x4', category: 'equipment', trade: 'Sopir', brand: 'Hino' },
  // Electrical
  { name: 'Gerinda Tangan 4 inch', category: 'electrical', trade: 'Tukang', brand: 'Makita' },
  { name: 'Bor Magnet 32mm', category: 'electrical', trade: 'Tukang', brand: 'Metabo' },
  { name: 'Mesin Bor SDS Max', category: 'electrical', trade: 'Tukang', brand: 'Bosch' },
  { name: 'Gerinda Potong 14 inch', category: 'electrical', trade: 'Tukang Besi', brand: 'Dewalt' },
  { name: 'Mesin Las Listrik 250A', category: 'electrical', trade: 'Tukang Las', brand: 'Clarke' },
  { name: 'Generator 5000W', category: 'electrical', trade: 'Operator', brand: 'Honda' },
  { name: 'Water Pump Submersible', category: 'electrical', trade: 'Pekerja', brand: 'Grundfos' },
  { name: 'Pompa Air 2 inch', category: 'electrical', trade: 'Pekerja', brand: 'Robin' },
  { name: 'Obeng Set 32pcs', category: 'electrical', trade: 'General', brand: 'Krisbow' },
  { name: 'Tang Kombinasi 10 inch', category: 'electrical', trade: 'General', brand: 'IDEAL' },
  // General construction
  { name: 'Cangkul Standard', category: 'general', trade: 'Pekerja', brand: 'Mekar' },
  { name: 'Sekop Standard', category: 'general', trade: 'Pekerja', brand: 'Nagain' },
  { name: 'Gergaji Besi Manual', category: 'general', trade: 'Tukang', brand: 'Bahco' },
  { name: 'Palu Besi 5kg', category: 'general', trade: 'Tukang', brand: 'Irwon' },
  { name: 'Palu Konde', category: 'general', trade: 'Tukang Kayu', brand: 'Tajima' },
  { name: 'Pahat Besi Set', category: 'general', trade: 'Tukang', brand: 'Krisbow' },
  { name: 'Gerobak Sorong', category: 'general', trade: 'Pekerja', brand: 'Maxguard' },
  { name: 'Cetok Stainless', category: 'general', trade: 'Tukang Batu', brand: 'Waskita' },
  { name: 'Raskam Besi', category: 'general', trade: 'Tukang Batu', brand: 'Krisbow' },
  { name: 'Bak Cor Plastik 60x60', category: 'general', trade: 'Pekerja', brand: 'Maxguard' },
];

// ============================================================================
// MAIN SEEDING FUNCTION
// ============================================================================

async function main() {
  console.log('======================================================================');
  console.log('SANTRA FULL DATABASE SEEDER');
  console.log('======================================================================');
  console.log('');

  // Get admin user
  const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!adminUser) {
    console.error('ERROR: No admin user found. Run main seed first.');
    return;
  }
  const adminId = adminUser.id;
  console.log('Admin: ' + adminUser.email);

  // Get all RABs
  const rabs = await prisma.rab.findMany({ orderBy: { number: 'asc' } });
  console.log('RABs found: ' + rabs.length);
  const rab1 = rabs.find(r => r.number.includes('001'));
  const rab2 = rabs.find(r => r.number.includes('002'));
  const rab3 = rabs.find(r => r.number.includes('003'));

  // Get all workers
  const workers = await prisma.worker.findMany({ orderBy: { workerCode: 'asc' } });
  console.log('Workers found: ' + workers.length);
  const mandors = workers.filter(w => w.role === 'MANDOR');
  const tukangs = workers.filter(w => w.role.includes('TUKANG'));
  const pekerjas = workers.filter(w => w.role === 'PEKERJA');

  // Get existing data counts
  const existingTools = await prisma.masterTool.count();
  const existingAssignments = await prisma.jobAssignment.count();
  const existingExecutions = await prisma.executionLog.count();
  const existingQC = await prisma.qcRecord.count();
  const existingDailyReports = await prisma.dailyReport.count();
  const existingLogbook = await prisma.logbookEntry.count();
  const existingMemos = await prisma.siteMemo.count();
  const existingLetters = await prisma.projectLetter.count();
  const existingBillings = await prisma.progressBilling.count();
  const existingSubmissions = await prisma.projectSubmission.count();
  const existingRabProgress = await prisma.rabProgress.count();

  console.log('');
  console.log('Current data status:');
  console.log('  Tools:', existingTools);
  console.log('  Assignments:', existingAssignments);
  console.log('  Executions:', existingExecutions);
  console.log('  QC Records:', existingQC);
  console.log('  Daily Reports:', existingDailyReports);
  console.log('  Logbook:', existingLogbook);
  console.log('  Memos:', existingMemos);
  console.log('  Letters:', existingLetters);
  console.log('  Billings:', existingBillings);
  console.log('  Submissions:', existingSubmissions);
  console.log('  Rab Progress:', existingRabProgress);

  // ============================================================
  // STEP 1: SEED MASTER TOOLS
  // ============================================================
  console.log('\n--- STEP 1: Seeding Master Tools ---');
  let toolsCreated = 0;
  for (let i = 0; i < MASTER_TOOLS_DATA.length; i++) {
    const t = MASTER_TOOLS_DATA[i];
    const toolCode = 'TOOL-' + String(i + 1).padStart(3, '0');
    const existing = await prisma.masterTool.findUnique({ where: { toolCode } });
    if (!existing) {
      await prisma.masterTool.create({
        data: {
          toolCode,
          name: t.name,
          category: t.category,
          trade: t.trade || null,
          brand: t.brand || null,
          minQuantity: 1,
          unit: t.category === 'safety' ? 'pcs' : t.category === 'equipment' ? 'unit' : 'pcs',
          currentCondition: ToolCondition.GOOD,
          owner: ToolOwner.COMPANY,
          isActive: true,
          isAvailable: true,
        }
      });
      toolsCreated++;
    }
  }
  console.log('Tools created: ' + toolsCreated);
  const tools = await prisma.masterTool.findMany();

  // ============================================================
  // STEP 2: SEED METHOD STATEMENTS
  // ============================================================
  console.log('\n--- STEP 2: Seeding Method Statements ---');
  const methodData = [
    { code: 'GEN-001', wbs: 'PRE_CONSTRUCTION', item: 'Persiapan Lokasi', scope: 'Pembersihan site, pagar proyek', hold: false },
    { code: 'CIV-001', wbs: 'SITE_PREPARATION', item: 'Pengukuran & Bowplank', scope: 'Pengukuran as bangunan', hold: true },
    { code: 'CIV-002', wbs: 'EARTHWORK', item: 'Galian Tanah Pondasi', scope: 'Galian untuk pondasi', hold: false },
    { code: 'STR-001', wbs: 'FOUNDATION', item: 'Pondasi Strauss Pile D300', scope: 'Pengeboran tiang bor', hold: true },
    { code: 'STR-002', wbs: 'STRUCTURE', item: 'Kolom Beton 40x40cm', scope: 'Pembesian & pengecoran kolom', hold: true },
    { code: 'STR-003', wbs: 'STRUCTURE', item: 'Balok Beton 30x50cm', scope: 'Pembesian & pengecoran balok', hold: false },
    { code: 'STR-004', wbs: 'STRUCTURE', item: 'Plat Lantai 12cm', scope: 'Pembesian & pengecoran plat', hold: false },
    { code: 'ARC-001', wbs: 'MASONRY', item: 'Pasangan Bata 1PC:5PP', scope: 'Pasangan dinding bata', hold: false },
    { code: 'ARC-002', wbs: 'ROOF', item: 'Rangka Atap Baja Ringan', scope: 'Pemasangan kuda-kuda', hold: true },
    { code: 'MEP-001', wbs: 'MEP', item: 'Instalasi Listrik', scope: 'Pemasangan kabel & fitting', hold: false },
    { code: 'FIN-001', wbs: 'FLOOR_WALL_FINISH', item: 'Pemasangan Lantai Keramik', scope: 'Pemasangan keramik lantai', hold: false },
    { code: 'FIN-002', wbs: 'FLOOR_WALL_FINISH', item: 'Plesteran Dinding', scope: 'Plesteran & acian', hold: false },
  ];
  let methodsCreated = 0;
  for (const m of methodData) {
    const existing = await prisma.methodStatement.findUnique({ where: { methodCode: m.code } });
    if (!existing) {
      await prisma.methodStatement.create({
        data: {
          methodCode: m.code,
          wbsStage: m.wbs as any,
          workItem: m.item,
          scope: m.scope,
          acceptanceCriteria: 'Sesuai spesifikasi teknis',
          holdPoint: m.hold,
          responsibleRoles: ['MANDOR', 'KEPALA_TUKANG'],
        }
      });
      methodsCreated++;
    }
  }
  console.log('Method Statements created: ' + methodsCreated);

  // ============================================================
  // STEP 3: SEED JOB ASSIGNMENTS
  // ============================================================
  console.log('\n--- STEP 3: Seeding Job Assignments ---');
  if (rab1 && existingAssignments === 0) {
    const assignmentsData = [
      { code: 'JOB-001', wbs: 'WBS-01.01', work: 'Pondasi Strauss Pile D300', status: 'COMPLETED', pct: 100, start: '2026-02-01', end: '2026-03-10' },
      { code: 'JOB-002', wbs: 'WBS-01.02', work: 'Sloof 30x50 cm', status: 'COMPLETED', pct: 100, start: '2026-03-11', end: '2026-03-28' },
      { code: 'JOB-003', wbs: 'WBS-01.03', work: 'Kolom 40x40 cm', status: 'COMPLETED', pct: 100, start: '2026-04-01', end: '2026-05-10' },
      { code: 'JOB-004', wbs: 'WBS-01.04', work: 'Balok 30x50 cm', status: 'COMPLETED', pct: 100, start: '2026-05-11', end: '2026-06-12' },
      { code: 'JOB-005', wbs: 'WBS-01.05', work: 'Plat Lantai 12cm', status: 'IN_PROGRESS', pct: 85, start: '2026-06-16', end: null },
      { code: 'JOB-006', wbs: 'WBS-02.01', work: 'Pasangan Bata 1PC:5PP', status: 'IN_PROGRESS', pct: 60, start: '2026-07-01', end: null },
      { code: 'JOB-007', wbs: 'WBS-02.02', work: 'Plesteran Dinding', status: 'PENDING', pct: 0, start: '2026-08-01', end: null },
      { code: 'JOB-008', wbs: 'WBS-02.03', work: 'Pengecatan Dinding', status: 'PENDING', pct: 0, start: '2026-09-01', end: null },
      { code: 'JOB-009', wbs: 'WBS-03.01', work: 'Instalasi Listrik', status: 'IN_PROGRESS', pct: 40, start: '2026-08-01', end: null },
      { code: 'JOB-010', wbs: 'WBS-03.02', work: 'Plumbing & Drainase', status: 'PENDING', pct: 0, start: '2026-08-15', end: null },
    ];
    for (const a of assignmentsData) {
      const existing = await prisma.jobAssignment.findUnique({ where: { assignmentCode: a.code } });
      if (!existing) {
        await prisma.jobAssignment.create({
          data: {
            assignmentCode: a.code,
            rabId: rab1.id,
            wbsCode: a.wbs,
            workItem: a.work,
            status: a.status as any,
            responsiblePersonId: tukangs[0]?.id || workers[0]?.id,
            responsibleMandorId: mandors[0]?.id || workers[0]?.id,
            plannedStart: new Date(a.start),
            plannedEnd: a.end ? new Date(a.end) : null,
            actualStart: a.status !== 'PENDING' ? new Date(a.start) : null,
            actualEnd: a.status === 'COMPLETED' && a.end ? new Date(a.end) : null,
            progressPct: a.pct,
            priority: 1,
          }
        });
      }
    }
    console.log('Assignments created for RAB-001');
  }

  if (rab2 && existingAssignments < 10) {
    const assignments2 = [
      { code: 'JOB-101', wbs: 'WBS-01.01', work: 'Pembongkaran Dinding Lama', status: 'COMPLETED', pct: 100, start: '2026-06-15', end: '2026-06-28' },
      { code: 'JOB-102', wbs: 'WBS-01.02', work: 'Pondasi Footplat 60x60', status: 'COMPLETED', pct: 100, start: '2026-06-29', end: '2026-07-08' },
      { code: 'JOB-103', wbs: 'WBS-01.03', work: 'Kolom Praktis 15x15', status: 'COMPLETED', pct: 100, start: '2026-07-11', end: '2026-07-22' },
      { code: 'JOB-104', wbs: 'WBS-01.04', work: 'Sloof 20x30 cm', status: 'COMPLETED', pct: 100, start: '2026-07-26', end: '2026-08-08' },
      { code: 'JOB-105', wbs: 'WBS-01.05', work: 'Dinding Batako 10x20x40', status: 'IN_PROGRESS', pct: 55, start: '2026-08-11', end: null },
    ];
    for (const a of assignments2) {
      const existing = await prisma.jobAssignment.findUnique({ where: { assignmentCode: a.code } });
      if (!existing) {
        await prisma.jobAssignment.create({
          data: {
            assignmentCode: a.code,
            rabId: rab2.id,
            wbsCode: a.wbs,
            workItem: a.work,
            status: a.status as any,
            responsiblePersonId: tukangs[1]?.id || workers[0]?.id,
            responsibleMandorId: mandors[1]?.id || workers[0]?.id,
            plannedStart: new Date(a.start),
            plannedEnd: a.end ? new Date(a.end) : null,
            actualStart: a.status !== 'PENDING' ? new Date(a.start) : null,
            actualEnd: a.status === 'COMPLETED' && a.end ? new Date(a.end) : null,
            progressPct: a.pct,
            priority: 1,
          }
        });
      }
    }
    console.log('Assignments created for RAB-002');
  }

  const assignments = await prisma.jobAssignment.findMany();
  console.log('Total Assignments: ' + assignments.length);

  // ============================================================
  // STEP 4: SEED DAILY REPORTS
  // ============================================================
  console.log('\n--- STEP 4: Seeding Daily Reports ---');
  if (existingDailyReports === 0) {
    const weatherOptions = ['CERAH', 'BERAWAN', 'GERIMIS', 'HUJAN'];
    for (const rab of rabs) {
      const scheduleStart = new Date(rab.scheduleStart || '2026-02-01');
      const today = new Date();
      let reportsCreated = 0;

      // Create 30 days of daily reports
      for (let day = 0; day < 30; day++) {
        const reportDate = new Date(today);
        reportDate.setDate(reportDate.getDate() - day);

        // Skip if before project start
        if (reportDate < scheduleStart) continue;

        const existingReport = await prisma.dailyReport.findUnique({
          where: { rabId_date: { rabId: rab.id, date: reportDate } }
        });
        if (existingReport) continue;

        const weather = weatherOptions[Math.floor(Math.random() * weatherOptions.length)];
        const pekerjaCount = 8 + Math.floor(Math.random() * 10);
        const tukangCount = 3 + Math.floor(Math.random() * 5);

        await prisma.dailyReport.create({
          data: {
            rabId: rab.id,
            date: reportDate,
            weatherAfternoon: weather as any,
            workforce: { pekerja: pekerjaCount, tukang: tukangCount } as any,
            activities: 'Pekerjaan berlangsung sesuai jadwal. Progress berjalan normal.',
            createdById: adminId,
          }
        });
        reportsCreated++;
      }
      console.log('Daily Reports for ' + rab.number + ': ' + reportsCreated);
    }
  } else {
    console.log('Daily Reports already exist: ' + existingDailyReports);
  }

  // ============================================================
  // STEP 5: SEED LOGBOOK ENTRIES
  // ============================================================
  console.log('\n--- STEP 5: Seeding Logbook Entries ---');
  if (existingLogbook === 0) {
    const logbookData = [
      { rabId: rab1?.id, date: '2026-08-10', time: '09:00', category: 'KUNJUNGAN_KONSULTAN', severity: 'INFO', title: 'Kunjungan Konsultan Pengawas', desc: 'Tim pengawas melakukan inspection rutin. Hasil: fondasi siap untuk tahap selanjutnya.' },
      { rabId: rab1?.id, date: '2026-08-12', time: '14:00', category: 'GANGGUAN_CUACA', severity: 'RINGAN', title: 'Hujan Deras Siang Ini', desc: 'Curah hujan tinggi mengganggu pekerjaan cor plat lantai 3.' },
      { rabId: rab1?.id, date: '2026-08-14', time: '07:00', category: 'INSTRUKSI_LAPANGAN', severity: 'INFO', title: 'Perubahan Detail Penulangan', desc: 'Konsultan mengeluarkan revised drawing untuk balok B3.' },
      { rabId: rab1?.id, date: '2026-08-15', time: '08:00', category: 'LAINNYA', severity: 'INFO', title: 'Rapat Progress Mingguan', desc: 'Capaian: fondasi 100%, kolom lantai 1 mencapai 80%.' },
      { rabId: rab1?.id, date: '2026-08-08', time: '10:00', category: 'KUNJUNGAN_KONSULTAN', severity: 'RINGAN', title: 'Klarifikasi Detail Struktur', desc: 'Konsultan meminta klarifikasi detail sambungan kolom K3.' },
      { rabId: rab1?.id, date: '2026-08-18', time: '13:00', category: 'KESALAHAN_KERJA', severity: 'RINGAN', title: 'Bekisting Tidak Rata', desc: 'Bekisting plat lantai 3 area B ditemukan tidak rata.' },
      { rabId: rab2?.id, date: '2026-08-14', time: '08:30', category: 'LAINNYA', severity: 'INFO', title: 'Rapat Koordinasi Progress', desc: 'Progress mencapai 45%. Pembongkaran selesai, fondasi selesai 100%.' },
      { rabId: rab2?.id, date: '2026-08-10', time: '09:00', category: 'KUNJUNGAN_CLIENT', severity: 'INFO', title: 'Survey Lokasi oleh Klien', desc: 'Klien meninjau langsung progress di lokasi. Klien puas.' },
      { rabId: rab2?.id, date: '2026-08-05', time: '07:30', category: 'INSTRUKSI_LAPANGAN', severity: 'RINGAN', title: 'Perubahan Desain Plafond', desc: 'Pemilik menginginkan perubahan ketinggian plafond.' },
      { rabId: rab2?.id, date: '2026-08-16', time: '10:00', category: 'KUNJUNGAN_KONSULTAN', severity: 'INFO', title: 'Inspection Struktur', desc: 'Konsultan pengawas memeriksa kolom praktis lantai 2.' },
      { rabId: rab2?.id, date: '2026-08-18', time: '14:30', category: 'KERUSAKAN_ALAT', severity: 'RINGAN', title: 'Mesin Gerinda Bermasalah', desc: 'Gerinda tangan tiba-tiba mati. Perlu perbaikan.' },
      { rabId: rab1?.id, date: '2026-08-20', time: '08:00', category: 'LAINNYA', severity: 'INFO', title: 'Pengiriman Material Steel Beam', desc: 'Material steel beam WF300 arriving. unloading started.' },
    ];

    for (const entry of logbookData) {
      if (!entry.rabId) continue;
      await prisma.logbookEntry.create({
        data: {
          rabId: entry.rabId,
          date: new Date(entry.date),
          timeOfDay: entry.time,
          category: entry.category as any,
          severity: entry.severity as any,
          title: entry.title,
          description: entry.desc,
          isResolved: entry.severity === 'INFO',
          resolvedAt: entry.severity === 'INFO' ? new Date(entry.date) : null,
          createdById: adminId,
        }
      });
    }
    console.log('Logbook Entries created: ' + logbookData.length);
  } else {
    console.log('Logbook Entries already exist: ' + existingLogbook);
  }

  // ============================================================
  // STEP 6: SEED SITE MEMOS
  // ============================================================
  console.log('\n--- STEP 6: Seeding Site Memos ---');
  if (existingMemos === 0) {
    const memosData = [
      { direction: 'INCOMING', category: 'INSTRUKSI', status: 'IN_PROGRESS', subject: 'Perubahan Lokasi Ground Tank Air', from: 'PT Nusantara Realty', to: 'PT Sanata', date: '2026-08-10', due: '2026-08-20', body: 'Mohon pemindahan lokasi ground water tank dari sisi barat ke sisi timur bangunan.' },
      { direction: 'OUTGOING', category: 'LAINNYA', status: 'CLOSED', subject: 'Jadwal Inspection Struktur', from: 'PT Sanata', to: 'PT Nusantara Realty', date: '2026-08-15', body: 'Kami menyampaikan jadwal inspection struktur yang akan dilakukan konsultan pengawas.' },
      { direction: 'INCOMING', category: 'ADDENDUM', status: 'OPEN', subject: 'Penambahan Area Carport', from: 'Budi Santoso', to: 'PT Sanata', date: '2026-08-12', due: '2026-08-18', body: 'Mohon penambahan luasan carport dari 20 m2 menjadi 30 m2.' },
      { direction: 'OUTGOING', category: 'APPROVAL', status: 'CLOSED', subject: 'Konfirmasi Penggunaan Material Alternatif', from: 'PT Sanata', to: 'PT Nusantara Realty', date: '2026-08-18', body: 'Sehubungan dengan ketersediaan material, kami propose penggunaan material alternatif yang setara.' },
      { direction: 'INCOMING', category: 'KLARIFIKASI', status: 'IN_PROGRESS', subject: 'Detail Sambungan Kolom K3', from: 'Konsultan Struktur', to: 'PT Sanata', date: '2026-08-20', body: 'Mohon klarifikasi detail sambungan kolom K3 dengan sloof.' },
      { direction: 'OUTGOING', category: 'LAINNYA', status: 'OPEN', subject: 'Progress Report Mingguan', from: 'PT Sanata', to: 'PT Nusantara Realty', date: '2026-08-22', body: 'Berikut laporan progress mingguan periode 15-22 Agustus 2026.' },
    ];

    for (let i = 0; i < memosData.length; i++) {
      const m = memosData[i];
      const direction = m.direction === 'INCOMING' ? 'SM-IN' : 'SM-OUT';
      const counter = await prisma.documentCounter.upsert({
        where: { series_year: { series: direction, year: 2026 } },
        update: { lastSeq: { increment: 1 } },
        create: { id: direction + '-' + 2026, series: direction, year: 2026, lastSeq: 0 },
        select: { lastSeq: true },
      });
      const memoNumber = direction + '-' + 2026 + '-' + String(counter.lastSeq).padStart(3, '0');

      const targetRab = i < 4 ? rab1 : rab2;
      if (!targetRab) continue;

      await prisma.siteMemo.create({
        data: {
          number: memoNumber,
          rabId: targetRab.id,
          direction: m.direction as any,
          category: m.category as any,
          status: m.status as any,
          subject: m.subject,
          body: m.body,
          fromParty: m.from,
          toParty: m.to,
          letterDate: new Date(m.date),
          dueDate: m.due ? new Date(m.due) : null,
          closedAt: m.status === 'CLOSED' ? new Date(m.date) : null,
          createdById: adminId,
        }
      });
    }
    console.log('Site Memos created: ' + memosData.length);
  } else {
    console.log('Site Memos already exist: ' + existingMemos);
  }

  // ============================================================
  // STEP 7: SEED PROJECT LETTERS
  // ============================================================
  console.log('\n--- STEP 7: Seeding Project Letters ---');

  // Helper to create letter only if not exists
  async function safeCreateLetter(data: any): Promise<boolean> {
    try {
      const exists = await prisma.projectLetter.findUnique({ where: { number: data.number } });
      if (exists) return false;
      await prisma.projectLetter.create({ data });
      return true;
    } catch (e) {
      return false;
    }
  }

  let lettersCreated = 0;
  if (rab1) {
    if (await safeCreateLetter({
      number: 'SPK-2026-001',
      rabId: rab1.id,
      type: 'SPK',
      status: 'SIGNED',
      subject: 'Surat Perjanjian Kerja Pembangunan Gedung',
      letterDate: new Date('2026-08-12'),
      issuedAt: new Date('2026-08-12'),
      signedAt: new Date('2026-08-14'),
      recipientName: 'Ir. Hendra Wijaya',
      recipientCompany: 'PT Nusantara Realty Indonesia',
      recipientAddress: 'Jl. Sudirman No. 45, Jakarta Selatan',
      signerName: 'Ir. Hendra Kusuma',
      signerTitle: 'Directeur Utama',
      amount: 5383500000,
      totalAmount: 5383500000,
      taxPct: 11,
      taxAmount: 533500000,
      amountInWords: 'Lima miliar tiga ratus delapan puluh tiga juta lima ratus ribu rupiah',
      body: { clauses: [] } as any,
      createdById: adminId,
    })) lettersCreated++;

    if (await safeCreateLetter({
      number: 'INV-2026-001',
      rabId: rab1.id,
      type: 'INVOICE',
      status: 'PAID',
      subject: 'Invoice Termin 1 - Progress 25%',
      letterDate: new Date('2026-05-15'),
      issuedAt: new Date('2026-05-15'),
      paidAt: new Date('2026-05-28'),
      dueDate: new Date('2026-06-14'),
      recipientName: 'Ir. Hendra Wijaya',
      recipientCompany: 'PT Nusantara Realty Indonesia',
      signerName: 'Ir. Hendra Kusuma',
      signerTitle: 'Directeur Utama',
      amount: 2050000000,
      retentionAmount: 102500000,
      taxPct: 11,
      taxAmount: 214225000,
      totalAmount: 2161725000,
      amountInWords: 'Dua miliar seratus enam puluh satu juta tujuh ratus dua puluh lima ribu rupiah',
      body: { lines: [] } as any,
      createdById: adminId,
    })) lettersCreated++;

    if (await safeCreateLetter({
      number: 'BAPP-2026-001',
      rabId: rab1.id,
      type: 'BAPP',
      status: 'SIGNED',
      subject: 'Berita Acara Penyelesaian Pekerjaan Termin 1',
      letterDate: new Date('2026-05-10'),
      issuedAt: new Date('2026-05-10'),
      signedAt: new Date('2026-05-12'),
      recipientName: 'Ir. Hendra Wijaya',
      recipientCompany: 'PT Nusantara Realty Indonesia',
      signerName: 'Ir. Dimas Nugroho',
      signerTitle: 'Kepala Engineering',
      body: { clauses: [] } as any,
      createdById: adminId,
    })) lettersCreated++;
  }

  if (rab2) {
    if (await safeCreateLetter({
      number: 'SPK-2026-002',
      rabId: rab2.id,
      type: 'SPK',
      status: 'SIGNED',
      subject: 'Surat Perjanjian Kerja Renovasi Rumah',
      letterDate: new Date('2026-07-16'),
      issuedAt: new Date('2026-07-16'),
      signedAt: new Date('2026-07-18'),
      recipientName: 'Budi Santoso',
      recipientAddress: 'Jl. Melati No. 8, Jakarta Selatan',
      signerName: 'Ir. Budi Santoso',
      signerTitle: 'Directeur Operasional',
      amount: 849150000,
      totalAmount: 849150000,
      taxPct: 11,
      taxAmount: 84150000,
      amountInWords: 'Delapan ratus empat puluh sembilan juta seratus lima puluh ribu rupiah',
      body: { clauses: [] } as any,
      createdById: adminId,
    })) lettersCreated++;
  }
  console.log('Project Letters created: ' + lettersCreated);

  // ============================================================
  // STEP 8: SEED PROGRESS BILLINGS
  // ============================================================
  console.log('\n--- STEP 8: Seeding Progress Billings ---');
  if (existingBillings === 0) {
    if (rab1) {
      await prisma.progressBilling.create({
        data: {
          number: 'BILL-2026-001',
          rabId: rab1.id,
          status: 'PAID',
          periodEnd: new Date('2026-04-30'),
          cumulativeValue: 2050000000,
          previousValue: 0,
          currentValue: 2050000000,
          retentionPct: 5,
          retentionAmount: 102500000,
          taxPct: 11,
          taxAmount: 214225000,
          netAmount: 2161725000,
          snapshot: {} as any,
          createdById: adminId,
        }
      });
      await prisma.progressBilling.create({
        data: {
          number: 'BILL-2026-002',
          rabId: rab1.id,
          status: 'ISSUED',
          periodEnd: new Date('2026-08-15'),
          cumulativeValue: 3850000000,
          previousValue: 2050000000,
          currentValue: 1800000000,
          retentionPct: 5,
          retentionAmount: 90000000,
          taxPct: 11,
          taxAmount: 188100000,
          netAmount: 1898100000,
          snapshot: {} as any,
          createdById: adminId,
        }
      });
      console.log('Billings created for RAB-001: 2');
    }

    if (rab2) {
      await prisma.progressBilling.create({
        data: {
          number: 'BILL-2026-003',
          rabId: rab2.id,
          status: 'PAID',
          periodEnd: new Date('2026-07-31'),
          cumulativeValue: 424575000,
          previousValue: 0,
          currentValue: 424575000,
          retentionPct: 5,
          retentionAmount: 21228750,
          taxPct: 11,
          taxAmount: 42150000,
          netAmount: 424575000,
          snapshot: {} as any,
          createdById: adminId,
        }
      });
      console.log('Billings created for RAB-002: 1');
    }
  } else {
    console.log('Billings already exist: ' + existingBillings);
  }

  // ============================================================
  // STEP 9: SEED PROJECT SUBMISSIONS
  // ============================================================
  console.log('\n--- STEP 9: Seeding Project Submissions ---');
  if (existingSubmissions === 0) {
    const submissionsData = [
      { rab: rab1, code: 'SUB-2026-001', type: 'MATERIAL', status: 'APPROVED_CLIENT', title: 'Pengadaan Steel Beam WF 300', reason: 'Perubahan desain struktural', cost: 285000000, date: '2026-08-05' },
      { rab: rab1, code: 'SUB-2026-002', type: 'WAKTU', status: 'SUBMITTED', title: 'Perpanjangan Waktu 14 Hari', reason: 'Keterlambatan pengiriman material', cost: 0, date: '2026-08-14' },
      { rab: rab1, code: 'SUB-2026-003', type: 'ALAT', status: 'DRAFT', title: 'Sewa Tower Crane untuk Lantai 3-4', reason: 'Perlu crane tambahan', cost: 95000000, date: '2026-08-20' },
      { rab: rab2, code: 'SUB-2026-004', type: 'MATERIAL', status: 'APPROVED_CLIENT', title: 'Perubahan Tipe Keramik Lantai', reason: 'Tipe keramik tidak tersedia', cost: 4500000, date: '2026-08-01' },
    ];

    for (const sub of submissionsData) {
      if (!sub.rab) continue;
      await prisma.projectSubmission.create({
        data: {
          number: sub.code,
          rabId: sub.rab.id,
          type: sub.type as any,
          status: sub.status as any,
          title: sub.title,
          reason: sub.reason,
          neededDate: new Date('2026-09-01'),
          estimatedCost: sub.cost,
          submittedAt: new Date(sub.date),
          requestedById: adminId,
        }
      });
    }
    console.log('Submissions created: ' + submissionsData.length);
  } else {
    console.log('Submissions already exist: ' + existingSubmissions);
  }

  // ============================================================
  // STEP 10: SEED RAB PROGRESS (Opname)
  // ============================================================
  console.log('\n--- STEP 10: Seeding Rab Progress (Opname) ---');
  if (existingRabProgress === 0) {
    const rabItems = await prisma.rabItem.findMany({ take: 20 });
    let progressCreated = 0;

    for (const item of rabItems) {
      // Create 1-3 progress records per item
      const numRecords = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < numRecords; i++) {
        const daysOffset = i * 14; // 2 weeks apart
        const progressDate = new Date('2026-08-01');
        progressDate.setDate(progressDate.getDate() + daysOffset);

        const percent = Math.min(100, (i + 1) * 25 + Math.floor(Math.random() * 20));
        await prisma.rabProgress.create({
          data: {
            itemId: item.id,
            date: progressDate,
            percent: percent,
            note: 'Progress opname ' + (i + 1),
            status: 'APPROVED',
            approvedById: adminId,
            approvedAt: new Date(progressDate.getTime() + 86400000),
          }
        });
        progressCreated++;
      }
    }
    console.log('Rab Progress records created: ' + progressCreated);
  } else {
    console.log('Rab Progress already exist: ' + existingRabProgress);
  }

  // ============================================================
  // STEP 11: SEED EXECUTION LOGS
  // ============================================================
  console.log('\n--- STEP 11: Seeding Execution Logs ---');
  const assignmentsNow = await prisma.jobAssignment.findMany();
  const existingExecNow = await prisma.executionLog.count();

  if (existingExecNow < 100) {
    let execCreated = 0;
    for (const assignment of assignmentsNow) {
      if (!assignment.actualStart) continue;

      const start = new Date(assignment.actualStart);
      const end = assignment.actualEnd || new Date('2026-08-25');
      const days = Math.ceil((end.getTime() - start.getTime()) / 86400000);
      const execDays = Math.min(days, 14);

      for (let i = 0; i < execDays; i++) {
        const execDate = new Date(start);
        execDate.setDate(execDate.getDate() + i);
        if (execDate > new Date()) continue;

        const counter = await prisma.santraCounter.upsert({
          where: { prefix: 'LOG' },
          update: { lastSeq: { increment: 1 } },
          create: { prefix: 'LOG', lastSeq: 1 },
          select: { lastSeq: true },
        });

        const workerId = assignment.responsiblePersonId || workers[0].id;
        const lat = -6.2088 + (Math.random() * 0.01);
        const lng = 106.8456 + (Math.random() * 0.01);

        await prisma.executionLog.create({
          data: {
            logCode: 'LOG-2026-' + String(counter.lastSeq).padStart(4, '0'),
            assignmentId: assignment.id,
            workerId,
            logDate: execDate,
            description: 'Pekerjaan ' + assignment.workItem + ' hari ke-' + (i + 1),
            progressPct: Math.round(((i + 1) / execDays) * 100),
            latitude: lat,
            longitude: lng,
            locationName: 'Lokasi Proyek',
          }
        });
        execCreated++;
      }
    }
    console.log('Execution Logs created: ' + execCreated);
  } else {
    console.log('Execution Logs already exist: ' + existingExecNow);
  }

  // ============================================================
  // STEP 12: SEED QC RECORDS
  // ============================================================
  console.log('\n--- STEP 12: Seeding QC Records ---');
  if (existingQC < 50) {
    const qcTemplates = [
      { desc: 'Pondasi Strauss Pile D300', criteria: 'Kedalaman min 12m, slump 18-22cm', wbs: 'FOUNDATION' },
      { desc: 'Sloof 30x50 cm', criteria: 'Ukuran sesuai gambar', wbs: 'FOUNDATION' },
      { desc: 'Kolom 40x40 cm', criteria: 'Tegak, tulangan sesuai', wbs: 'STRUCTURE' },
      { desc: 'Pembesian Balok', criteria: 'Diameter & jarak sesuai spec', wbs: 'STRUCTURE' },
      { desc: 'Plat Lantai 12cm', criteria: 'Tebal sesuai spec', wbs: 'STRUCTURE' },
      { desc: 'Pasangan Bata', criteria: 'Rata, vertikal', wbs: 'MASONRY' },
      { desc: 'Plesteran', criteria: 'Rata, tidak retak', wbs: 'MASONRY' },
      { desc: 'Kusen Aluminium', criteria: 'Rata, sesuai spec', wbs: 'FLOOR_WALL_FINISH' },
    ];

    let qcCreated = 0;
    for (let i = 0; i < 50; i++) {
      const template = qcTemplates[i % qcTemplates.length];
      const assignment = assignmentsNow[i % assignmentsNow.length];
      const worker = workers[i % workers.length];
      if (!assignment || !worker) continue;

      const counter = await prisma.santraCounter.upsert({
        where: { prefix: 'QC' },
        update: { lastSeq: { increment: 1 } },
        create: { prefix: 'QC', lastSeq: 1 },
        select: { lastSeq: true },
      });

      const resultRand = Math.random();
      const result = resultRand < 0.85 ? 'PASS' : resultRand < 0.95 ? 'REWORK' : 'FAIL';
      const weatherOpts = ['CERAH', 'BERAWAN', 'GERIMIS', 'HUJAN'];

      await prisma.qcRecord.create({
        data: {
          qcCode: 'QC-2026-' + String(counter.lastSeq).padStart(4, '0'),
          assignmentId: assignment.id,
          workerId: worker.id,
          checkDate: new Date(2026, 6, 1 + (i % 30)),
          itemDesc: template.desc,
          criteria: template.criteria,
          measurement: 'Sesuai spec',
          result: result as any,
          wbsStage: template.wbs as any,
          checkType: 'POST_CHECK' as any,
          defectDesc: result !== 'PASS' ? 'Perlu perbaikan' : null,
          isRework: result === 'REWORK',
          latitude: -6.2088 + (Math.random() * 0.01),
          longitude: 106.8456 + (Math.random() * 0.01),
          weather: weatherOpts[Math.floor(Math.random() * weatherOpts.length)],
        }
      });
      qcCreated++;
    }
    console.log('QC Records created: ' + qcCreated);
  } else {
    console.log('QC Records already exist: ' + existingQC);
  }

  // ============================================================
  // FINAL SUMMARY
  // ============================================================
  console.log('\n======================================================================');
  console.log('SEEDING COMPLETE');
  console.log('======================================================================');

  const stats = await Promise.all([
    prisma.worker.count(),
    prisma.masterTool.count(),
    prisma.methodStatement.count(),
    prisma.jobAssignment.count(),
    prisma.executionLog.count(),
    prisma.qcRecord.count(),
    prisma.rabItem.count(),
    prisma.dailyReport.count(),
    prisma.logbookEntry.count(),
    prisma.siteMemo.count(),
    prisma.projectLetter.count(),
    prisma.progressBilling.count(),
    prisma.projectSubmission.count(),
    prisma.rabProgress.count(),
  ]);

  console.log('\nDATA SUMMARY:');
  console.log('  Workers:          ' + stats[0]);
  console.log('  Master Tools:     ' + stats[1]);
  console.log('  Method Statements:' + stats[2]);
  console.log('  Job Assignments:  ' + stats[3]);
  console.log('  Execution Logs:   ' + stats[4]);
  console.log('  QC Records:       ' + stats[5]);
  console.log('  Rab Items:        ' + stats[6]);
  console.log('  Daily Reports:    ' + stats[7]);
  console.log('  Logbook Entries:  ' + stats[8]);
  console.log('  Site Memos:       ' + stats[9]);
  console.log('  Project Letters:  ' + stats[10]);
  console.log('  Billings:         ' + stats[11]);
  console.log('  Submissions:      ' + stats[12]);
  console.log('  Rab Progress:     ' + stats[13]);
  console.log('\n======================================================================');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
