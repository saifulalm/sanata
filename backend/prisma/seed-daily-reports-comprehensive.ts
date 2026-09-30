/**
 * seed-daily-reports-comprehensive.ts
 * Comprehensive Daily Reports seed for ALL RAB projects
 *
 * Features:
 * - 60-90 daily reports per project covering 3-4 months
 * - Varied weather data (CERAH, BERAWAN, GERIMIS, HUJAN, HUJAN_LEBAT)
 * - Workforce breakdown by role with realistic numbers
 * - Detailed activity descriptions per work type
 * - Notes for coordination, issues, and special events
 * - DailyReportWorkforce entries for structured data
 * - S-curve compatible progress data
 * - No duplicate reports for same date/rab combination
 */

import { PrismaClient, Weather, ProjectRole } from '@prisma/client';

const prisma = new PrismaClient();

// Weather types
const weatherTypes: Weather[] = ['CERAH', 'BERAWAN', 'GERIMIS', 'HUJAN', 'HUJAN_LEBAT'];

// Project workforce configurations
interface WorkforceConfig {
  workers: number;
  tukangBatu: number;
  tukangKayu: number;
  tukangBesi: number;
  operators: number;
  kepalaTukang: number;
  mandor: number;
}

const workforceConfigs: Record<string, WorkforceConfig> = {
  // Large building project - high workforce
  'RAB-2026-001': {
    workers: 18,
    tukangBatu: 8,
    tukangKayu: 5,
    tukangBesi: 6,
    operators: 3,
    kepalaTukang: 3,
    mandor: 2,
  },
  // House renovation - medium workforce
  'RAB-2026-002': {
    workers: 8,
    tukangBatu: 4,
    tukangKayu: 2,
    tukangBesi: 1,
    operators: 1,
    kepalaTukang: 1,
    mandor: 1,
  },
  // Factory project - very high workforce
  'RAB-2026-003': {
    workers: 35,
    tukangBatu: 15,
    tukangKayu: 10,
    tukangBesi: 12,
    operators: 6,
    kepalaTukang: 5,
    mandor: 3,
  },
  // Office renovation - medium workforce
  'RAB-2026-004': {
    workers: 12,
    tukangBatu: 5,
    tukangKayu: 4,
    tukangBesi: 3,
    operators: 2,
    kepalaTukang: 2,
    mandor: 1,
  },
  // Warehouse - medium-high workforce
  'RAB-2026-006': {
    workers: 20,
    tukangBatu: 10,
    tukangKayu: 6,
    tukangBesi: 5,
    operators: 4,
    kepalaTukang: 3,
    mandor: 2,
  },
  // Hospital - very high workforce
  'RAB-2026-007': {
    workers: 45,
    tukangBatu: 18,
    tukangKayu: 12,
    tukangBesi: 15,
    operators: 8,
    kepalaTukang: 6,
    mandor: 4,
  },
};

// Activity descriptions by project type and phase
const activitiesByPhase: Record<string, string[]> = {
  foundation: [
    'Penggalian tanah fondasi menggunakan excavator',
    'Pemasangan bouwplank dan pengukuran elevasi',
    'Pengecoran pondasi footplat dengan beton K-250',
    'Perakitan tulangan pondasi Strauss pile',
    'Pemadatan tanah urug dengan stamper',
    'Pemasangan bekisting pondasi',
    'Pengecoran sloof dengan pompa beton',
    'Perataan tanah dasar dengan motor grader',
    'Pemasangan pondasi Strauss pile D300',
    'Pemotongan dan pembengkokan tulangan',
    'Pemasangan spacer dan bersih-bersih tulangan',
    'Inspeksi kualitas tulangan fondasi',
    'Pengecoran pile cap dengan ready mix',
    'Perawatan beton (curing) dengan air',
  ],
  structure: [
    'Pemasangan tulangan kolom lantai 1',
    'Pemasangan bekisting kolom dengan Tripod',
    'Pengecoran kolom dengan concrete bucket',
    'Perakitan tulangan balok dengan mesin potong',
    'Pemasangan bekisting balok dan plat',
    'Pengecoran balok dan plat lantai secara kontinyu',
    'Pembongkaran bekisting setelah curing 14 hari',
    'Pemasangan tulanganplat lantai dengan spacer',
    'Pengelasan sambungan tulangan kolom',
    'Pengecoran plat lantai dengan concrete pump',
    'Instalasi pipa conduit di dalam struktur',
    'Pemasangan besi sengkang pada kolom',
    'Quality check dimensional kolom dan balok',
    'Pemasangan drop panel pada plat lantai',
  ],
  masonry: [
    'Pemasangan dinding bata merah 1PC:5PP',
    'Pemasangan dinding batako untuk partisi dalam',
    'Pembuatan شمسم (lesung) pada dinding',
    'Pemasangan bata dekoratif pada facade',
    'Pembuatan kusen buka pada dinding',
    'Pengacian dinding bata setelah 14 hari',
    'Pemasangan granit tile pada dinding',
    'Pembuatan sekat kamar mandi dengan bata',
    'Pemasangan roster/ventilasi pada dinding',
    'Perataan sudut-sudut dinding dengan roskam',
    'Pengecatan dasar (plamir) dinding interior',
    'Pemasangan nat (grouting) antar bata',
  ],
  finishing: [
    'Pemasangan lantai keramik 60x60 cm',
    'Pemasangan lantai granit 80x80 cm',
    'Plesteran dinding interior dengan MOTAR',
    'Acian dinding interior dengan semen putih',
    'Pengecatan dinding dengan cat dasar',
    'Pengecatan dinding dengan cat finish 2x coats',
    'Pemasangan plafon gypsum 9mm',
    'Pemasangan list plank gypsum pada plafon',
    'Pemasangan floor hardener pada lantai',
    'Pemasangan wallpaper dinding ruang meeting',
    'Pemasangan vinyl flooring pada ruang kerja',
    'Pemasangan karpet pada ruang direktur',
    'Pembersihan dan polishing lantai granit',
  ],
  roof: [
    'Pemasangan kuda-kuda baja ringan',
    'Pemasangan reng dan usuk baja ringan',
    'Pemasangan penutup atap genteng beton',
    'Pemasangan nok genteng dengan mortar',
    'Pemasangan talang air galvanized',
    'Pemasangan flashing pada pertemuan atap',
    'Pengecatan dasar struktur atap',
    'Pemasangan insulasi panas pada atap',
    'Pemasangan skylight pada atap',
    'Pemasangan pagar pengaman bordes tangga',
  ],
  mep: [
    'Pemasangan conduit listrik dengan fixed spacing',
    'Penarikan kabel listrik NYY dan NYM',
    'Pemasangan titik lampu LED pada plafon',
    'Pemasangan saklar dan stop kontak',
    'Instalasi panel listrik dan MCB',
    'Pemasangan pipa PVC air bersih',
    'Pemasangan pipa HDPE pembuangan air',
    'Pemasangan fixture sanitasi kamar mandi',
    'Instalasi AC split dengan piping copper',
    'Pemasangan drainase permukaan dengan buis beton',
    'Pemasangan fire alarm dengan smoke detector',
    'Pengujian tekanan pipa air bersih',
    'Pemasangan grounding system pada panel',
  ],
  external: [
    'Pengaspalan jalan akses dengan hotmix',
    'Pemasangan paving block pada halaman',
    'Pemasangan kanstin dan border taman',
    'Pengurukan tanah taman dengan top soil',
    'Pemasangan grass block pada area hijau',
    'Pemasangan lampu taman (garden light)',
    'Pemasangan pagar panel beton precast',
    'Pemasangan gerbang utama dengan automatik',
    'Pemasangan cermin bundar pada lobi',
    'Pembersihan area proyek dari sisa material',
  ],
  preparation: [
    'Pemasangan papan proyek dan rambu K3',
    'Pembersihan lahan dari semak dan sampah',
    'Pemasangan base camp dan gudang material',
    'Pengukuran batas tanah dengan theodolit',
    'Pemasangan tower liquid gas (TLG)',
    'Pengadaan air kerja dan listrik sementara',
    'Pembuatan jalan akses alat berat',
    'Marking area galian dengan cat semprot',
    'Pemasangan CCTV untuk monitoring proyek',
    'Briefing K3 kepada seluruh pekerja',
  ],
  demolition: [
    'Pembongkaran dinding partisi existing',
    'Pembongkaran plafon lama dengan hati-hati',
    'Pembongkaran lantai keramik existing',
    'Pembongkaran instalasi listrik lama',
    'Pembersihan material bekas bongkar',
    'Pembuangan puing ke TPS resmi',
    'Pencabutan instalasi plumbing lama',
    'Pembongkaran kusen dan pintu lama',
    'Pembobokan lantai beton yang akan direnovasi',
    'Pelepasan fixture sanitari dari dinding',
  ],
  steel: [
    'Perakitan steel frame dengan baut high tensile',
    'Pengelasan sambungan kolom baja WF',
    'Pemasangan bracket connection pada kolom',
    'Pengelasan plat sambung pada balok',
    'Pengecatan dasar (primer) steel structure',
    'Pemasangan angkur bolt pada pondasi',
    'Perakitan truss atap dengan crane',
    'Pemasangan girt dan purlin pada bangunan',
    'Quality check dimensi dan level structure',
    'Pengecatan finish steel structure',
  ],
  medical: [
    'Pemasangan medical gas outlet di ruang operasi',
    'Instalasi sistem vakum medis pada ruang perawatan',
    'Pemasangan diffuser AC di ruang steril',
    'Instalasi panel nurse call di setiap ruangan',
    'Pemasangan back panel pada ruang radiologi',
    'Instalasi UPS untuk ruang server rumah sakit',
    'Pemasangan CCTV medis di area koridor',
    'Quality check instalasi listrik ruang medis',
    'Instalasi oxygen pipeline system',
    'Pemasangan fire dampper pada ducting AC',
  ],
};

// Notes for different scenarios
const coordinationNotes = [
  'Koordinasi dengan konsultan pengawas untuk inspeksi harian',
  'Rapat progress mingguan dengan klien',
  'Koordinasi dengan supplier material pengiriman besok',
  'Sesuai jadwal yang telah disepakati',
  'Progress sesuai target mingguan',
  'Koordinasi dengan tim ME untuk penyesuaian layout',
  'Persiapan untuk inspection dari pihak manajemen',
  'Koordinasi dengan subkontraktor lift',
  'Review shop drawing untuk detail arsitektural',
  'Diskusi teknis dengan arsitek mengenai perubahan finish',
];

const issueNotes = [
  'Material semen terlambat datang, pekerjaan ditunda 2 jam',
  'Curah hujan tinggi mengganggu pengecoran, cover dengan terpal',
  'Listrik padam 1 jam, genset dinyalakan',
  'Adanya perubahan design dari konsultan, sosialisasi ke tim',
  'Ketinggian elevasi tidak sesuai, dilakukan koreksi',
  'Terjadi kebocoran pada bekisting saat pengecoran, segera diperbaiki',
  'Besi tulangan tidak sesuai spec, ditahan dulu menunggu kedatangan yang benar',
  'Protest workers mengenai jam lembur, didiskusikan dengan mandor',
  'Alat concrete mixer bermasalah, servicing dilakukan siang ini',
  'Keterlambatan pengiriman ready mix, waiting time 30 menit',
];

const successNotes = [
  'Pengecoran selesai tepat waktu, kualitas baik',
  'Inspeksi QC passed, hasil memuaskan',
  'Tim bekerja dengan efisien, target tercapai',
  'Progress melebihi jadwal 5%, excellent work',
  'Klien puas dengan hasil pekerjaan fondasi',
  'Pemasangan baja berhasil presisi sesuai tolerance',
  'Pekerjaan finishing lantai 2 selesai dengan hasil rapi',
  'Serah terima bagian pekerjaan disetujui konsultan',
  'Zero accident achieved, K3 protocol followed',
  'Tim menyelesaikan pekerjaan tambahan tanpa complain',
];

// Helper functions
function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getWeatherForDate(date: Date): Weather {
  const month = date.getMonth();
  // Rainy season in Indonesia: November - March (months 10-2)
  if (month >= 10 || month <= 2) {
    const weights = { CERAH: 20, BERAWAN: 30, GERIMIS: 25, HUJAN: 20, HUJAN_LEBAT: 5 };
    return weightedRandom(weights);
  } else {
    const weights = { CERAH: 50, BERAWAN: 35, GERIMIS: 10, HUJAN: 4, HUJAN_LEBAT: 1 };
    return weightedRandom(weights);
  }
}

function weightedRandom(weights: Record<string, number>): Weather {
  const entries = Object.entries(weights);
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let random = Math.random() * total;
  for (const [weather, weight] of entries) {
    random -= weight;
    if (random <= 0) return weather as Weather;
  }
  return 'CERAH';
}

function generateWorkforce(config: WorkforceConfig, variance: number = 0.3): {
  workforce: Record<string, number>;
  workforceEntries: Array<{ role: ProjectRole; count: number }>;
} {
  const workforce: Record<string, number> = {
    'Pekerja': Math.round(config.workers * (1 + (Math.random() - 0.5) * variance)),
    'Tukang Batu': Math.round(config.tukangBatu * (1 + (Math.random() - 0.5) * variance)),
    'Tukang Kayu': Math.round(config.tukangKayu * (1 + (Math.random() - 0.5) * variance)),
    'Tukang Besi': Math.round(config.tukangBesi * (1 + (Math.random() - 0.5) * variance)),
    'Operator': Math.round(config.operators * (1 + (Math.random() - 0.5) * variance)),
    'Kepala Tukang': Math.round(config.kepalaTukang * (1 + (Math.random() - 0.5) * variance)),
    'Mandor': Math.round(config.mandor * (1 + (Math.random() - 0.5) * variance)),
  };

  const workforceEntries = [
    { role: 'PEKERJA' as ProjectRole, count: workforce['Pekerja'] },
    { role: 'TUKANG_BATU' as ProjectRole, count: workforce['Tukang Batu'] },
    { role: 'TUKANG_KAYU' as ProjectRole, count: workforce['Tukang Kayu'] },
    { role: 'TUKANG_BESI' as ProjectRole, count: workforce['Tukang Besi'] },
    { role: 'OPERATOR' as ProjectRole, count: workforce['Operator'] },
    { role: 'KEPALA_TUKANG' as ProjectRole, count: workforce['Kepala Tukang'] },
    { role: 'MANDOR' as ProjectRole, count: workforce['Mandor'] },
  ];

  return { workforce, workforceEntries };
}

function getPhasesForProject(rabNumber: string, dayOffset: number): string[] {
  const phases: Record<string, { phases: string[]; transitionDays: number[] }> = {
    'RAB-2026-001': {
      // 350-day building project
      phases: ['preparation', 'foundation', 'structure', 'structure', 'masonry', 'finishing', 'mep', 'finishing'],
      transitionDays: [0, 30, 90, 150, 200, 280, 300, 330],
    },
    'RAB-2026-002': {
      // 90-day house renovation
      phases: ['demolition', 'foundation', 'structure', 'masonry', 'finishing', 'roof', 'mep', 'finishing'],
      transitionDays: [0, 15, 30, 45, 55, 65, 75, 85],
    },
    'RAB-2026-003': {
      // Large factory - 300 days
      phases: ['preparation', 'foundation', 'structure', 'structure', 'steel', 'masonry', 'mep', 'external'],
      transitionDays: [0, 45, 120, 180, 220, 250, 280, 300],
    },
    'RAB-2026-004': {
      // Office renovation - 120 days
      phases: ['demolition', 'structure', 'masonry', 'finishing', 'mep', 'finishing'],
      transitionDays: [0, 20, 40, 60, 85, 100],
    },
    'RAB-2026-006': {
      // Warehouse - 180 days
      phases: ['preparation', 'foundation', 'structure', 'roof', 'masonry', 'mep', 'external'],
      transitionDays: [0, 30, 80, 120, 140, 155, 170],
    },
    'RAB-2026-007': {
      // Hospital - 400 days
      phases: ['preparation', 'foundation', 'structure', 'structure', 'masonry', 'medical', 'finishing', 'mep', 'external'],
      transitionDays: [0, 40, 100, 180, 240, 280, 320, 350, 380],
    },
  };

  const config = phases[rabNumber];
  if (!config) return ['preparation'];

  let currentPhase = config.phases[0];
  for (let i = 0; i < config.transitionDays.length; i++) {
    if (dayOffset >= config.transitionDays[i]) {
      currentPhase = config.phases[i] || currentPhase;
    }
  }
  return [currentPhase];
}

function getActivitiesForPhase(phases: string[]): string[] {
  const allActivities: string[] = [];
  for (const phase of phases) {
    const activities = activitiesByPhase[phase] || [];
    allActivities.push(...activities);
  }
  // Return 2-4 activities per day
  const count = randomInt(2, 4);
  const selected: string[] = [];
  for (let i = 0; i < count && allActivities.length > 0; i++) {
    const idx = randomInt(0, allActivities.length - 1);
    selected.push(allActivities.splice(idx, 1)[0]);
  }
  return selected;
}

function isRestDay(date: Date, restDays: number[] = [0]): boolean {
  // 0 = Sunday, 6 = Saturday in JavaScript
  const dayOfWeek = date.getDay();
  // Convert to project's rest day format (0 = Sunday)
  if (restDays.includes(dayOfWeek)) return true;
  return false;
}

function isHoliday(date: Date, holidays: Date[]): boolean {
  return holidays.some(h => h.toDateString() === date.toDateString());
}

async function seedDailyReportsForRAB(
  rab: { id: string; number: string; scheduleStart: Date | null },
  holidays: Date[],
  adminId: string,
  daysToGenerate: number
) {
  console.log(`\n📋 Seeding daily reports for ${rab.number} (${daysToGenerate} days)...`);

  if (!rab.scheduleStart) {
    console.log(`⚠️  Skipping ${rab.number} - no scheduleStart date`);
    return 0;
  }

  const config = workforceConfigs[rab.number] || workforceConfigs['RAB-2026-001'];
  let reportCount = 0;
  let skipCount = 0;
  const today = new Date();

  // Generate reports starting from schedule start date
  const startDate = new Date(rab.scheduleStart);
  const endDate = new Date(Math.min(today.getTime(), startDate.getTime() + daysToGenerate * 24 * 60 * 60 * 1000));

  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    // Skip weekends and holidays
    if (isRestDay(currentDate) || isHoliday(currentDate, holidays)) {
      currentDate.setDate(currentDate.getDate() + 1);
      continue;
    }

    // Check if report already exists
    const existingReport = await prisma.dailyReport.findFirst({
      where: {
        rabId: rab.id,
        date: {
          gte: new Date(currentDate.setHours(0, 0, 0, 0)),
          lte: new Date(currentDate.setHours(23, 59, 59, 999)),
        },
      },
    });

    if (existingReport) {
      skipCount++;
      currentDate.setDate(currentDate.getDate() + 1);
      continue;
    }

    // Calculate day offset for phase determination
    const dayOffset = Math.floor((currentDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    const phases = getPhasesForProject(rab.number, dayOffset);
    const activities = getActivitiesForPhase(phases);

    // Generate workforce data
    const { workforce, workforceEntries } = generateWorkforce(config);

    // Get weather
    const weatherAfternoon = getWeatherForDate(currentDate);
    const weatherMorning = Math.random() > 0.3 ? weatherAfternoon : getWeatherForDate(new Date(currentDate.getTime() - 2 * 60 * 60 * 1000));

    // Generate weather log
    const weatherLog = [
      { hour: '07:00', weather: weatherMorning === 'HUJAN' || weatherMorning === 'HUJAN_LEBAT' ? 'BERAWAN' : weatherMorning },
      { hour: '08:00', weather: weatherMorning },
      { hour: '09:00', weather: weatherAfternoon },
      { hour: '10:00', weather: weatherAfternoon },
      { hour: '11:00', weather: weatherAfternoon },
      { hour: '12:00', weather: weatherAfternoon },
      { hour: '13:00', weather: weatherAfternoon === 'HUJAN' || weatherAfternoon === 'HUJAN_LEBAT' ? 'GERIMIS' : weatherAfternoon },
      { hour: '14:00', weather: weatherAfternoon },
      { hour: '15:00', weather: weatherAfternoon },
      { hour: '16:00', weather: weatherAfternoon === 'HUJAN' ? 'BERAWAN' : weatherAfternoon },
    ];

    // Generate work activities JSON
    const workActivities = phases.map(phase => ({
      building: `Area ${phases.indexOf(phase) + 1}`,
      activities: activities.filter((_, idx) => idx % phases.length === phases.indexOf(phase)).slice(0, 2),
    }));

    // Generate notes
    let notes: string | null = null;
    const rand = Math.random();
    if (rand < 0.15) {
      notes = randomElement(issueNotes);
    } else if (rand < 0.30) {
      notes = randomElement(coordinationNotes);
    } else if (rand < 0.40) {
      notes = randomElement(successNotes);
    }

    // Equipment and materials
    const equipmentList = ['Concrete mixer', 'Excavator PC 100', 'Tower crane', 'Vibrator', ' Stamper', 'Gerinda', 'Mesin las'];
    const materialsList = ['Semen 50kg', 'Besi D13', 'Besi D10', 'Batu bata', 'Pasir', 'Keramik 60x60'];

    // Create the daily report
    const report = await prisma.dailyReport.create({
      data: {
        rabId: rab.id,
        date: new Date(currentDate),
        weatherMorning: weatherMorning,
        weatherAfternoon: weatherAfternoon,
        weatherLog: weatherLog,
        workforce: workforce as any,
        activities: activities.join('; '),
        workActivities: workActivities as any,
        equipment: randomElement(equipmentList) + (Math.random() > 0.5 ? ', ' + randomElement(equipmentList.slice(1)) : ''),
        materials: randomElement(materialsList) + (Math.random() > 0.5 ? ', ' + randomElement(materialsList.slice(1)) : ''),
        testPerformed: Math.random() > 0.8 ? 'Slump test: 12cm - OK. Temperature: 32°C - OK' : null,
        obstacles: Math.random() > 0.9 ? randomElement(issueNotes) : null,
        notes: notes,
        createdById: adminId,
      },
    });

    // Create workforce entries
    for (let i = 0; i < workforceEntries.length; i++) {
      const entry = workforceEntries[i];
      if (entry.count > 0) {
        await prisma.dailyReportWorkforce.create({
          data: {
            reportId: report.id,
            role: entry.role,
            count: entry.count,
            order: i,
          },
        });
      }
    }

    reportCount++;

    // Progress indicator
    if (reportCount % 10 === 0) {
      process.stdout.write('.');
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  console.log(`\n✅ Created ${reportCount} daily reports for ${rab.number} (skipped ${skipCount} existing)`);
  return reportCount;
}

async function seedRabProgressFromDailyReports(rabId: string) {
  console.log(`📊 Generating progress data from daily reports for ${rabId}...`);

  const reports = await prisma.dailyReport.findMany({
    where: { rabId },
    orderBy: { date: 'asc' },
    include: { workforceEntries: true },
  });

  if (reports.length === 0) return;

  // Calculate cumulative progress based on workforce attendance and activities
  const items = await prisma.rabItem.findMany({
    where: { section: { rabId } },
    orderBy: { startOffsetDays: 'asc' },
    take: 5,
  });

  let cumulativeProgress = 0;
  const progressMap = new Map<string, number>();

  for (const item of items) {
    const itemStartDay = item.startOffsetDays;
    const itemEndDay = item.startOffsetDays + item.durationDays;

    for (let day = itemStartDay; day <= itemEndDay; day++) {
      const reportDate = new Date(reports[0].date);
      reportDate.setDate(reportDate.getDate() + day);

      const report = reports.find(r => {
        const rDate = new Date(r.date);
        return rDate.toDateString() === reportDate.toDateString();
      });

      if (report) {
        const totalWorkers = report.workforceEntries.reduce((sum, e) => sum + e.count, 0);
        const dailyProgress = (100 / item.durationDays) * (totalWorkers > 10 ? 1 : 0.7);
        progressMap.set(item.id, (progressMap.get(item.id) || 0) + dailyProgress);
      }
    }
  }

  // Create progress entries for first 2 items
  for (let i = 0; i < Math.min(2, items.length); i++) {
    const item = items[i];
    const itemProgress = Math.min(progressMap.get(item.id) || 0, 100);

    const reportIndex = Math.floor((item.startOffsetDays / 350) * reports.length);
    const report = reports[reportIndex] || reports[0];

    if (report && itemProgress > 0) {
      // Check if progress already exists
      const existingProgress = await prisma.rabProgress.findFirst({
        where: {
          itemId: item.id,
          date: report.date,
        },
      });

      if (!existingProgress) {
        await prisma.rabProgress.create({
          data: {
            itemId: item.id,
            date: report.date,
            percent: Math.round(itemProgress),
            status: itemProgress >= 100 ? 'APPROVED' : 'PENDING',
            createdById: null,
          },
        });
      }
    }
  }

  console.log(`✅ Progress data generated`);
}

async function main() {
  console.log('🚀 Starting Comprehensive Daily Reports Seed...\n');
  console.log('='.repeat(60));

  // Get admin user
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: { id: true },
  });

  if (!admin) {
    console.error('❌ No admin user found. Please run the main seed first.');
    process.exit(1);
  }

  const adminId = admin.id;

  // Get all RABs
  const rabs = await prisma.rab.findMany({
    where: {
      status: {
        in: ['APPROVED', 'ARCHIVED'],
      },
    },
    orderBy: { scheduleStart: 'asc' },
  });

  console.log(`📦 Found ${rabs.length} RAB projects to seed daily reports`);

  let totalReports = 0;

  for (const rab of rabs) {
    // Get holidays for this RAB
    const holidaysData = await prisma.rabHoliday.findMany({
      where: { rabId: rab.id },
      select: { date: true },
    });
    const holidays = holidaysData.map(h => new Date(h.date));

    // Determine days to generate based on project status
    let daysToGenerate = 90;
    if (rab.status === 'ARCHIVED') {
      daysToGenerate = 180; // Completed projects may have more data
    }

    const count = await seedDailyReportsForRAB(rab, holidays, adminId, daysToGenerate);
    totalReports += count;

    // Generate progress data from daily reports
    await seedRabProgressFromDailyReports(rab.id);
  }

  // Handle DRAFT/REVIEW/REJECTED projects - minimal or no daily reports
  const inactiveRabs = await prisma.rab.findMany({
    where: {
      status: {
        in: ['DRAFT', 'REVIEW', 'REJECTED'],
      },
    },
  });

  console.log(`\n📋 Checking ${inactiveRabs.length} inactive RAB projects...`);

  for (const rab of inactiveRabs) {
    // Only generate a few sample reports for REVIEW projects
    if (rab.status === 'REVIEW' && rab.scheduleStart) {
      const sampleCount = await seedDailyReportsForRAB(rab, [], adminId, 14);
      totalReports += sampleCount;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n🎉 DAILY REPORTS SEED COMPLETE!`);
  console.log(`📊 Total reports created: ${totalReports}`);
  console.log('\n📋 Summary by Project:');

  // Print summary
  for (const rab of rabs) {
    const count = await prisma.dailyReport.count({ where: { rabId: rab.id } });
    const workforceCount = await prisma.dailyReportWorkforce.count({
      where: { report: { rabId: rab.id } },
    });
    console.log(`   ${rab.number}: ${count} reports, ${workforceCount} workforce entries`);
  }

  console.log('\n✅ Database is now populated with comprehensive daily report data!');
  console.log('   - Weather variations based on season');
  console.log('   - Realistic workforce breakdowns by role');
  console.log('   - Phase-based activity descriptions');
  console.log('   - Coordination and issue notes');
  console.log('   - Structured workforce entries for S-curve integration');
}

main()
  .then(() => {
    console.log('\n✨ All done!');
    process.exit(0);
  })
  .catch((e) => {
    console.error('\n❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
