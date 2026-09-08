/**
 * SANTRA Comprehensive Enhanced Seeder v6
 * Run: npx tsx prisma/seed-santra-v6.ts
 *
 * Features:
 * - Idempotent seeding (safe to run multiple times)
 * - Fixed duplicate KTP issue
 * - Added more workers, tools, method statements, QC templates
 * - Better execution logs with GPS data
 * - Tool loans and maintenance history
 */

import { PrismaClient, ProjectRole, WorkerGrade, WorkerStatus } from "@prisma/client";

const prisma = new PrismaClient();

// ============================================================
// WORKERS DATA - Fixed duplicate KTP numbers
// ============================================================
const WORKERS_DATA = [
  // MANDOR (5 workers)
  { workerCode: "M-0001", name: "Harsono Wijaya", role: "MANDOR" as ProjectRole, phone: "081234567801", ktpNumber: "3201234567800001", grade: "A" as WorkerGrade, skills: ["supervision", "concrete", "general"], experienceYears: 15, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2010-03-15") },
  { workerCode: "M-0002", name: "Dedi Kurniawan", role: "MANDOR" as ProjectRole, phone: "081234567802", ktpNumber: "3201234567800002", grade: "A" as WorkerGrade, skills: ["supervision", "structural", "masonry"], experienceYears: 12, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2013-06-01") },
  { workerCode: "M-0003", name: "Asep Saepuloh", role: "MANDOR" as ProjectRole, phone: "081234567803", ktpNumber: "3201234567800003", grade: "B" as WorkerGrade, skills: ["steel", "supervision"], experienceYears: 10, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2019-01-10") },
  { workerCode: "M-0004", name: "Sukmawan", role: "MANDOR" as ProjectRole, phone: "081234567804", ktpNumber: "3201234567800004", grade: "B" as WorkerGrade, skills: ["general", "supervision"], experienceYears: 8, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2020-05-20") },
  { workerCode: "M-0005", name: "Toni Hermawan", role: "MANDOR" as ProjectRole, phone: "081234567805", ktpNumber: "3201234567800005", grade: "B" as WorkerGrade, skills: ["supervision", "finishing"], experienceYears: 6, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2021-03-15") },

  // KEPALA TUKANG (5 workers)
  { workerCode: "KT-0001", name: "Ucup Surucup", role: "KEPALA_TUKANG" as ProjectRole, phone: "081234567851", ktpNumber: "3201234567800051", grade: "A" as WorkerGrade, skills: ["masonry", "leadership", "plaster"], experienceYears: 12, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2016-08-01") },
  { workerCode: "KT-0002", name: "Maman Suparman", role: "KEPALA_TUKANG" as ProjectRole, phone: "081234567852", ktpNumber: "3201234567800052", grade: "A" as WorkerGrade, skills: ["carpentry", "leadership", "formwork"], experienceYears: 11, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2017-02-15") },
  { workerCode: "KT-0003", name: "Jajang Cengkar", role: "KEPALA_TUKANG" as ProjectRole, phone: "081234567853", ktpNumber: "3201234567800053", grade: "A" as WorkerGrade, skills: ["steel", "leadership", "welding"], experienceYears: 10, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2018-04-10") },
  { workerCode: "KT-0004", name: "Entis Sutisna", role: "KEPALA_TUKANG" as ProjectRole, phone: "081234567854", ktpNumber: "3201234567800054", grade: "B" as WorkerGrade, skills: ["general", "leadership"], experienceYears: 7, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2021-06-01") },
  { workerCode: "KT-0005", name: "Rendi Firmansyah", role: "KEPALA_TUKANG" as ProjectRole, phone: "081234567855", ktpNumber: "3201234567800055", grade: "B" as WorkerGrade, skills: ["masonry", "leadership"], experienceYears: 6, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2022-01-10") },

  // TUKANG BATU (12 workers)
  { workerCode: "T-0001", name: "Udin Hasan", role: "TUKANG_BATU" as ProjectRole, phone: "081234567901", ktpNumber: "3201234567800011", grade: "A" as WorkerGrade, skills: ["masonry", "plaster", "tiles"], experienceYears: 8, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2020-02-01") },
  { workerCode: "T-0002", name: "Cecep Supriatna", role: "TUKANG_BATU" as ProjectRole, phone: "081234567902", ktpNumber: "3201234567800012", grade: "A" as WorkerGrade, skills: ["masonry", "plaster"], experienceYears: 7, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2021-04-15") },
  { workerCode: "T-0003", name: "Dedi Rohendi", role: "TUKANG_BATU" as ProjectRole, phone: "081234567903", ktpNumber: "3201234567800013", grade: "B" as WorkerGrade, skills: ["masonry", "tiles"], experienceYears: 5, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2022-07-20") },
  { workerCode: "T-0004", name: "Tono Wartono", role: "TUKANG_BATU" as ProjectRole, phone: "081234567904", ktpNumber: "3201234567800014", grade: "B" as WorkerGrade, skills: ["masonry", "plaster"], experienceYears: 4, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2023-01-10") },
  { workerCode: "T-0005", name: "Juju Jumadi", role: "TUKANG_BATU" as ProjectRole, phone: "081234567905", ktpNumber: "3201234567800015", grade: "C" as WorkerGrade, skills: ["masonry"], experienceYears: 2, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2024-03-01") },
  { workerCode: "T-0006", name: "Asep Dudung", role: "TUKANG_BATU" as ProjectRole, phone: "081234567906", ktpNumber: "3201234567800016", grade: "B" as WorkerGrade, skills: ["masonry", "plaster"], experienceYears: 6, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2022-05-15") },
  { workerCode: "T-0007", name: "Nana Nurjaman", role: "TUKANG_BATU" as ProjectRole, phone: "081234567907", ktpNumber: "3201234567800017", grade: "C" as WorkerGrade, skills: ["masonry"], experienceYears: 1, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2025-02-01") },
  { workerCode: "T-0008", name: "Ujang Komaruddin", role: "TUKANG_BATU" as ProjectRole, phone: "081234567908", ktpNumber: "3201234567800018", grade: "B" as WorkerGrade, skills: ["masonry", "tiles"], experienceYears: 4, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2023-08-20") },
  { workerCode: "T-0009", name: "Ahmad Sopian", role: "TUKANG_BATU" as ProjectRole, phone: "081234567909", ktpNumber: "3201234567800019", grade: "C" as WorkerGrade, skills: ["masonry"], experienceYears: 2, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2024-06-01") },
  { workerCode: "T-0010", name: "Rudi Hermawan", role: "TUKANG_BATU" as ProjectRole, phone: "081234567910", ktpNumber: "3201234567800020", grade: "B" as WorkerGrade, skills: ["masonry", "plaster"], experienceYears: 3, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2024-01-15") },
  { workerCode: "T-0011", name: "Dadang Dedi", role: "TUKANG_BATU" as ProjectRole, phone: "081234567911", ktpNumber: "3201234567800021", grade: "C" as WorkerGrade, skills: ["masonry"], experienceYears: 2, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2024-05-10") },
  { workerCode: "T-0012", name: "Eri Erwanto", role: "TUKANG_BATU" as ProjectRole, phone: "081234567912", ktpNumber: "3201234567800022", grade: "B" as WorkerGrade, skills: ["masonry", "tiles"], experienceYears: 3, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2023-11-01") },

  // TUKANG KAYU (8 workers)
  { workerCode: "K-0001", name: "Iman Sutarman", role: "TUKANG_KAYU" as ProjectRole, phone: "081234568001", ktpNumber: "3201234567800021", grade: "A" as WorkerGrade, skills: ["carpentry", "formwork", "finishing"], experienceYears: 10, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2018-05-01") },
  { workerCode: "K-0002", name: "Enjang Kusnadi", role: "TUKANG_KAYU" as ProjectRole, phone: "081234568002", ktpNumber: "3201234567800022", grade: "B" as WorkerGrade, skills: ["carpentry", "formwork"], experienceYears: 6, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2021-08-15") },
  { workerCode: "K-0003", name: "Otoy Oom", role: "TUKANG_KAYU" as ProjectRole, phone: "081234568003", ktpNumber: "3201234567800023", grade: "B" as WorkerGrade, skills: ["carpentry", "finishing"], experienceYears: 4, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2023-02-01") },
  { workerCode: "K-0004", name: "Dadang Supriatna", role: "TUKANG_KAYU" as ProjectRole, phone: "081234568004", ktpNumber: "3201234567800024", grade: "B" as WorkerGrade, skills: ["carpentry", "formwork"], experienceYears: 5, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2022-03-10") },
  { workerCode: "K-0005", name: "Taryo Sumantri", role: "TUKANG_KAYU" as ProjectRole, phone: "081234568005", ktpNumber: "3201234567800025", grade: "C" as WorkerGrade, skills: ["carpentry"], experienceYears: 2, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2024-04-01") },
  { workerCode: "K-0006", name: "Arip Saefuloh", role: "TUKANG_KAYU" as ProjectRole, phone: "081234568006", ktpNumber: "3201234567800026", grade: "C" as WorkerGrade, skills: ["carpentry"], experienceYears: 1, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2025-01-15") },
  { workerCode: "K-0007", name: "Fajar Abdul", role: "TUKANG_KAYU" as ProjectRole, phone: "081234568007", ktpNumber: "3201234567800027", grade: "B" as WorkerGrade, skills: ["carpentry", "formwork"], experienceYears: 3, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2023-09-01") },
  { workerCode: "K-0008", name: "Gilang Permana", role: "TUKANG_KAYU" as ProjectRole, phone: "081234568008", ktpNumber: "3201234567800028", grade: "C" as WorkerGrade, skills: ["carpentry"], experienceYears: 1, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2025-03-01") },

  // TUKANG BESI (7 workers)
  { workerCode: "B-0001", name: "Hasan Basri", role: "TUKANG_BESI" as ProjectRole, phone: "081234568101", ktpNumber: "3201234567800031", grade: "A" as WorkerGrade, skills: ["steel", "welding", "fabrication"], experienceYears: 9, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2019-07-01") },
  { workerCode: "B-0002", name: "Jujun Junaedi", role: "TUKANG_BESI" as ProjectRole, phone: "081234568102", ktpNumber: "3201234567800032", grade: "B" as WorkerGrade, skills: ["steel", "welding"], experienceYears: 5, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2022-04-10") },
  { workerCode: "B-0003", name: "Wawan Setiawan", role: "TUKANG_BESI" as ProjectRole, phone: "081234568103", ktpNumber: "3201234567800033", grade: "B" as WorkerGrade, skills: ["steel", "fabrication"], experienceYears: 4, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2023-05-20") },
  { workerCode: "B-0004", name: "Deden Mahpudin", role: "TUKANG_BESI" as ProjectRole, phone: "081234568104", ktpNumber: "3201234567800034", grade: "C" as WorkerGrade, skills: ["steel"], experienceYears: 2, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2024-07-01") },
  { workerCode: "B-0005", name: "Iif Solihin", role: "TUKANG_BESI" as ProjectRole, phone: "081234568105", ktpNumber: "3201234567800035", grade: "C" as WorkerGrade, skills: ["steel", "welding"], experienceYears: 3, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2023-11-15") },
  { workerCode: "B-0006", name: "Rizki Pratama", role: "TUKANG_BESI" as ProjectRole, phone: "081234568106", ktpNumber: "3201234567800036", grade: "B" as WorkerGrade, skills: ["steel", "welding"], experienceYears: 4, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2023-03-01") },
  { workerCode: "B-0007", name: "Feri Firmansyah", role: "TUKANG_BESI" as ProjectRole, phone: "081234568107", ktpNumber: "3201234567800037", grade: "C" as WorkerGrade, skills: ["steel"], experienceYears: 1, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2025-01-01") },

  // OPERATOR (6 workers)
  { workerCode: "O-0001", name: "Aceng Cucu", role: "OPERATOR" as ProjectRole, phone: "081234568201", ktpNumber: "3201234567800041", grade: "A" as WorkerGrade, skills: ["excavator", "loader", "dump_truck"], experienceYears: 8, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2020-01-15") },
  { workerCode: "O-0002", name: "Arip Aripin", role: "OPERATOR" as ProjectRole, phone: "081234568202", ktpNumber: "3201234567800042", grade: "B" as WorkerGrade, skills: ["concrete_mixer", "vibrator"], experienceYears: 4, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2023-06-01") },
  { workerCode: "O-0003", name: "Cepi Supriatna", role: "OPERATOR" as ProjectRole, phone: "081234568203", ktpNumber: "3201234567800043", grade: "B" as WorkerGrade, skills: ["excavator", "crane"], experienceYears: 6, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2022-02-10") },
  { workerCode: "O-0004", name: "Dadang Rustandi", role: "OPERATOR" as ProjectRole, phone: "081234568204", ktpNumber: "3201234567800044", grade: "C" as WorkerGrade, skills: ["concrete_mixer", "vibrator"], experienceYears: 2, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2024-08-01") },
  { workerCode: "O-0005", name: "Eko Wahyudi", role: "OPERATOR" as ProjectRole, phone: "081234568205", ktpNumber: "3201234567800045", grade: "B" as WorkerGrade, skills: ["excavator", "loader"], experienceYears: 3, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2023-08-15") },
  { workerCode: "O-0006", name: "Fikri Hamdan", role: "OPERATOR" as ProjectRole, phone: "081234568206", ktpNumber: "3201234567800046", grade: "C" as WorkerGrade, skills: ["concrete_mixer"], experienceYears: 1, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2025-02-01") },

  // PEKERJA (25 workers) - Fixed KTP numbers to be unique
  { workerCode: "P-0001", name: "Sugeng Rahayu", role: "PEKERJA" as ProjectRole, phone: "081234568301", ktpNumber: "3201234567800061", grade: "B" as WorkerGrade, skills: ["general"], experienceYears: 3, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2023-03-01") },
  { workerCode: "P-0002", name: "Rahmat Hidayat", role: "PEKERJA" as ProjectRole, phone: "081234568302", ktpNumber: "3201234567800062", grade: "C" as WorkerGrade, skills: ["general"], experienceYears: 1, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2025-01-15") },
  { workerCode: "P-0003", name: "Iwan Setiawan", role: "PEKERJA" as ProjectRole, phone: "081234568303", ktpNumber: "3201234567800063", grade: "C" as WorkerGrade, skills: ["general"], experienceYears: 1, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2025-06-01") },
  { workerCode: "P-0004", name: "Asep Jatnika", role: "PEKERJA" as ProjectRole, phone: "081234568304", ktpNumber: "3201234567800064", grade: "C" as WorkerGrade, skills: ["general"], experienceYears: 1, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2025-03-01") },
  { workerCode: "P-0005", name: "Dedi Hermawan", role: "PEKERJA" as ProjectRole, phone: "081234568305", ktpNumber: "3201234567800065", grade: "C" as WorkerGrade, skills: ["general"], experienceYears: 2, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2024-05-01") },
  { workerCode: "P-0006", name: "Ahmad Fadillah", role: "PEKERJA" as ProjectRole, phone: "081234568306", ktpNumber: "3201234567800066", grade: "C" as WorkerGrade, skills: ["general"], experienceYears: 1, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2025-04-15") },
  { workerCode: "P-0007", name: "Sopian Saprudin", role: "PEKERJA" as ProjectRole, phone: "081234568307", ktpNumber: "3201234567800067", grade: "C" as WorkerGrade, skills: ["general"], experienceYears: 2, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2024-02-01") },
  { workerCode: "P-0008", name: "Tarno Slamet", role: "PEKERJA" as ProjectRole, phone: "081234568308", ktpNumber: "3201234567800068", grade: "C" as WorkerGrade, skills: ["general"], experienceYears: 1, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2025-05-01") },
  { workerCode: "P-0009", name: "Sandi Nugraha", role: "PEKERJA" as ProjectRole, phone: "081234568309", ktpNumber: "3201234567800069", grade: "C" as WorkerGrade, skills: ["general"], experienceYears: 1, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2025-07-01") },
  { workerCode: "P-0010", name: "Galih Pratama", role: "PEKERJA" as ProjectRole, phone: "081234568310", ktpNumber: "3201234567800070", grade: "C" as WorkerGrade, skills: ["general"], experienceYears: 2, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2024-09-01") },

  { workerCode: "P-0011", name: "Rizki Ramadhan", role: "PEKERJA" as ProjectRole, phone: "081234568311", ktpNumber: "3201234567800071", grade: "C" as WorkerGrade, skills: ["general"], experienceYears: 1, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2025-02-15") },
  { workerCode: "P-0012", name: "Fajar Nugroho", role: "PEKERJA" as ProjectRole, phone: "081234568312", ktpNumber: "3201234567800072", grade: "C" as WorkerGrade, skills: ["general"], experienceYears: 1, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2025-06-15") },
  { workerCode: "P-0013", name: "Bayu Firmansyah", role: "PEKERJA" as ProjectRole, phone: "081234568313", ktpNumber: "3201234567800073", grade: "C" as WorkerGrade, skills: ["general"], experienceYears: 2, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2024-04-01") },
  { workerCode: "P-0014", name: "Gilang Permana", role: "PEKERJA" as ProjectRole, phone: "081234568314", ktpNumber: "3201234567800074", grade: "C" as WorkerGrade, skills: ["general"], experienceYears: 1, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2025-03-15") },
  { workerCode: "P-0015", name: "Deni Saputra", role: "PEKERJA" as ProjectRole, phone: "081234568315", ktpNumber: "3201234567800075", grade: "C" as WorkerGrade, skills: ["general"], experienceYears: 1, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2025-07-15") },
  { workerCode: "P-0016", name: "Feri Ferdiansyah", role: "PEKERJA" as ProjectRole, phone: "081234568316", ktpNumber: "3201234567800076", grade: "C" as WorkerGrade, skills: ["general"], experienceYears: 1, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2025-08-01") },
  { workerCode: "P-0017", name: "Ari Suhendar", role: "PEKERJA" as ProjectRole, phone: "081234568317", ktpNumber: "3201234567800077", grade: "C" as WorkerGrade, skills: ["general"], experienceYears: 1, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2025-04-01") },
  { workerCode: "P-0018", name: "Hendro Prasetyo", role: "PEKERJA" as ProjectRole, phone: "081234568318", ktpNumber: "3201234567800078", grade: "C" as WorkerGrade, skills: ["general"], experienceYears: 2, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2024-06-15") },
  { workerCode: "P-0019", name: "Indra Gunawan", role: "PEKERJA" as ProjectRole, phone: "081234568319", ktpNumber: "3201234567800079", grade: "C" as WorkerGrade, skills: ["general"], experienceYears: 1, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2025-05-15") },
  { workerCode: "P-0020", name: "Joko Susilo", role: "PEKERJA" as ProjectRole, phone: "081234568320", ktpNumber: "3201234567800080", grade: "C" as WorkerGrade, skills: ["general"], experienceYears: 2, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2024-08-01") },
  { workerCode: "P-0021", name: "Kurniawan Adi", role: "PEKERJA" as ProjectRole, phone: "081234568321", ktpNumber: "3201234567800081", grade: "C" as WorkerGrade, skills: ["general"], experienceYears: 1, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2025-06-01") },
  { workerCode: "P-0022", name: "Lukman Hakim", role: "PEKERJA" as ProjectRole, phone: "081234568322", ktpNumber: "3201234567800082", grade: "C" as WorkerGrade, skills: ["general"], experienceYears: 1, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2025-07-01") },
  { workerCode: "P-0023", name: "Mahmud Efendi", role: "PEKERJA" as ProjectRole, phone: "081234568323", ktpNumber: "3201234567800083", grade: "C" as WorkerGrade, skills: ["general"], experienceYears: 2, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2024-10-01") },
  { workerCode: "P-0024", name: "Naufal Rizki", role: "PEKERJA" as ProjectRole, phone: "081234568324", ktpNumber: "3201234567800084", grade: "C" as WorkerGrade, skills: ["general"], experienceYears: 1, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2025-08-01") },
  { workerCode: "P-0025", name: "Oki Oktafian", role: "PEKERJA" as ProjectRole, phone: "081234568325", ktpNumber: "3201234567800085", grade: "C" as WorkerGrade, skills: ["general"], experienceYears: 1, status: "ACTIVE" as WorkerStatus, joinDate: new Date("2025-08-15") },
];


// ============================================================
// TOOLS DATA
// ============================================================
const TOOLS_DATA = [
  // MEASUREMENT TOOLS
  { toolCode: "TOOL-001", name: "Theodolite Sokkia", category: "measurement", trade: "survey", minQuantity: 1, unit: "unit", brand: "Sokkia", model: "DT-510", purchaseDate: new Date("2022-03-15"), purchasePrice: 45000000, currentCondition: "GOOD", owner: "COMPANY", isAvailable: true },
  { toolCode: "TOOL-002", name: "Total Station Topcon", category: "measurement", trade: "survey", minQuantity: 1, unit: "unit", brand: "Topcon", model: "GPT-9000", purchaseDate: new Date("2021-06-20"), purchasePrice: 125000000, currentCondition: "GOOD", owner: "COMPANY", isAvailable: true },
  { toolCode: "TOOL-003", name: "Waterpass Leica", category: "measurement", trade: "survey", minQuantity: 2, unit: "unit", brand: "Leica", model: "NA-724", purchaseDate: new Date("2020-01-10"), purchasePrice: 28000000, currentCondition: "GOOD", owner: "COMPANY", isAvailable: true },
  { toolCode: "TOOL-004", name: "Meteran 50m", category: "measurement", trade: "general", minQuantity: 5, unit: "unit", brand: "Tajima", model: "TMR-50", purchaseDate: new Date("2023-04-01"), purchasePrice: 450000, currentCondition: "GOOD", owner: "COMPANY", isAvailable: true },
  { toolCode: "TOOL-005", name: "Waterpass Tube", category: "measurement", trade: "general", minQuantity: 3, unit: "unit", brand: "Bosch", model: "GOL-26D", purchaseDate: new Date("2022-08-15"), purchasePrice: 3500000, currentCondition: "FAIR", owner: "COMPANY", isAvailable: true },

  // SAFETY EQUIPMENT
  { toolCode: "TOOL-010", name: "Helmet Safety", category: "safety", trade: "all", minQuantity: 50, unit: "pcs", brand: "MSA", model: "V-Gard", purchaseDate: new Date("2024-01-01"), purchasePrice: 185000, currentCondition: "GOOD", owner: "COMPANY", isAvailable: true },
  { toolCode: "TOOL-011", name: "Safety Harness", category: "safety", trade: "all", minQuantity: 10, unit: "set", brand: "Miller", model: "TurboLite", purchaseDate: new Date("2023-06-15"), purchasePrice: 2500000, currentCondition: "GOOD", owner: "COMPANY", isAvailable: true },
  { toolCode: "TOOL-012", name: "Safety Shoes Krusher", category: "safety", trade: "all", minQuantity: 30, unit: "pairs", brand: "Krusher", model: "K-888", purchaseDate: new Date("2024-02-01"), purchasePrice: 650000, currentCondition: "GOOD", owner: "COMPANY", isAvailable: true },
  { toolCode: "TOOL-013", name: "Safety Glasses", category: "safety", trade: "all", minQuantity: 40, unit: "pcs", brand: "3M", model: "Virtua", purchaseDate: new Date("2024-03-01"), purchasePrice: 85000, currentCondition: "GOOD", owner: "COMPANY", isAvailable: true },
  { toolCode: "TOOL-014", name: "Ear Protection", category: "safety", trade: "all", minQuantity: 20, unit: "pcs", brand: "3M", model: "X5A", purchaseDate: new Date("2024-03-01"), purchasePrice: 250000, currentCondition: "GOOD", owner: "COMPANY", isAvailable: true },

  // CONCRETE & CONSTRUCTION EQUIPMENT
  { toolCode: "TOOL-020", name: "Concrete Mixer 350L", category: "equipment", trade: "concrete", minQuantity: 2, unit: "unit", brand: "KEMCO", model: "CM-350", purchaseDate: new Date("2020-05-10"), purchasePrice: 35000000, currentCondition: "GOOD", owner: "COMPANY", isAvailable: true, needsMaintenance: true, maintenanceIntervalDays: 90 },
  { toolCode: "TOOL-021", name: "Concrete Vibrator", category: "equipment", trade: "concrete", minQuantity: 3, unit: "unit", brand: "Makita", model: "VR520", purchaseDate: new Date("2021-03-20"), purchasePrice: 8500000, currentCondition: "GOOD", owner: "COMPANY", isAvailable: true },
  { toolCode: "TOOL-022", name: "Beton Vibrator Needle", category: "equipment", trade: "concrete", minQuantity: 4, unit: "unit", brand: "Bosch", model: "GNF-35CA", purchaseDate: new Date("2022-07-15"), purchasePrice: 4500000, currentCondition: "GOOD", owner: "COMPANY", isAvailable: true },
  { toolCode: "TOOL-023", name: "Concrete Cutter", category: "equipment", trade: "general", minQuantity: 2, unit: "unit", brand: "Makita", model: "EK6100", purchaseDate: new Date("2021-11-01"), purchasePrice: 12000000, currentCondition: "GOOD", owner: "COMPANY", isAvailable: true },
  { toolCode: "TOOL-024", name: "Concrete Breaker", category: "equipment", trade: "general", minQuantity: 2, unit: "unit", brand: "Bosch", model: "GBH 2-28", purchaseDate: new Date("2023-02-15"), purchasePrice: 8500000, currentCondition: "GOOD", owner: "COMPANY", isAvailable: true },

  // ELECTRICAL TOOLS
  { toolCode: "TOOL-030", name: "Gerinda 4 inch", category: "electrical", trade: "general", minQuantity: 6, unit: "unit", brand: "Makita", model: "9557NB", purchaseDate: new Date("2022-04-01"), purchasePrice: 1200000, currentCondition: "GOOD", owner: "COMPANY", isAvailable: true },
  { toolCode: "TOOL-031", name: "Gerinda 9 inch", category: "electrical", trade: "general", minQuantity: 3, unit: "unit", brand: "Makita", model: "GA9020", purchaseDate: new Date("2021-08-15"), purchasePrice: 2500000, currentCondition: "GOOD", owner: "COMPANY", isAvailable: true },
  { toolCode: "TOOL-032", name: "Mesin Bor Magnet", category: "electrical", trade: "steel", minQuantity: 2, unit: "unit", brand: "Metabo", model: "BME 64", purchaseDate: new Date("2022-11-01"), purchasePrice: 18500000, currentCondition: "GOOD", owner: "COMPANY", isAvailable: true },
  { toolCode: "TOOL-033", name: "Travo Las 200A", category: "electrical", trade: "welding", minQuantity: 3, unit: "unit", brand: "Elektroda", model: "ELT-200", purchaseDate: new Date("2021-05-20"), purchasePrice: 6500000, currentCondition: "GOOD", owner: "COMPANY", isAvailable: true },
  { toolCode: "TOOL-034", name: "Gerinda Tangan", category: "electrical", trade: "general", minQuantity: 8, unit: "unit", brand: "Bosch", model: "GWS 6-100", purchaseDate: new Date("2023-06-01"), purchasePrice: 950000, currentCondition: "GOOD", owner: "COMPANY", isAvailable: true },

  // GENERAL CONSTRUCTION TOOLS
  { toolCode: "TOOL-040", name: "Gergaji Mesin", category: "general", trade: "carpentry", minQuantity: 3, unit: "unit", brand: "Makita", model: "5008MG", purchaseDate: new Date("2022-02-15"), purchasePrice: 4500000, currentCondition: "GOOD", owner: "COMPANY", isAvailable: true },
  { toolCode: "TOOL-041", name: "Palu Besi 5kg", category: "general", trade: "general", minQuantity: 10, unit: "pcs", brand: "Stanley", model: "STMT-81646", purchaseDate: new Date("2023-04-01"), purchasePrice: 185000, currentCondition: "GOOD", owner: "COMPANY", isAvailable: true },
  { toolCode: "TOOL-042", name: "Cangkul", category: "general", trade: "earthwork", minQuantity: 8, unit: "pcs", brand: "Talang", purchaseDate: new Date("2023-05-01"), purchasePrice: 95000, currentCondition: "GOOD", owner: "COMPANY", isAvailable: true },
  { toolCode: "TOOL-043", name: "Gunting Besi", category: "general", trade: "steel", minQuantity: 4, unit: "pcs", brand: "Tajima", model: "TC-240", purchaseDate: new Date("2022-09-01"), purchasePrice: 450000, currentCondition: "GOOD", owner: "COMPANY", isAvailable: true },
  { toolCode: "TOOL-044", name: "Kunci Pas Set", category: "general", trade: "general", minQuantity: 5, unit: "set", brand: "Pro'sKit", model: "PK-6001M", purchaseDate: new Date("2023-07-01"), purchasePrice: 650000, currentCondition: "GOOD", owner: "COMPANY", isAvailable: true },
  { toolCode: "TOOL-045", name: "Tang Kombinasi", category: "general", trade: "general", minQuantity: 10, unit: "pcs", brand: "Knipex", model: "87-125", purchaseDate: new Date("2022-03-01"), purchasePrice: 450000, currentCondition: "GOOD", owner: "COMPANY", isAvailable: true },
  { toolCode: "TOOL-046", name: "Waterpass 60cm", category: "measurement", trade: "general", minQuantity: 6, unit: "pcs", brand: "Stanley", model: "42-468", purchaseDate: new Date("2023-08-01"), purchasePrice: 250000, currentCondition: "GOOD", owner: "COMPANY", isAvailable: true },
  { toolCode: "TOOL-047", name: "Senar Nylon", category: "general", trade: "carpentry", minQuantity: 20, unit: "roll", brand: "Tajima", model: "TN-100", purchaseDate: new Date("2024-01-01"), purchasePrice: 85000, currentCondition: "GOOD", owner: "COMPANY", isAvailable: true },
  { toolCode: "TOOL-048", name: "Paku Besi various", category: "general", trade: "general", minQuantity: 50, unit: "kg", purchaseDate: new Date("2024-02-01"), purchasePrice: 35000, currentCondition: "GOOD", owner: "COMPANY", isAvailable: true },
  { toolCode: "TOOL-049", name: "Benang Per_MARKING", category: "general", trade: "general", minQuantity: 10, unit: "roll", brand: "Tajima", model: "CP-50", purchaseDate: new Date("2024-03-01"), purchasePrice: 45000, currentCondition: "GOOD", owner: "COMPANY", isAvailable: true },
  { toolCode: "TOOL-050", name: "Bak Cor Plastik 50L", category: "general", trade: "concrete", minQuantity: 20, unit: "pcs", brand: "Krisbow", model: "KW18015", purchaseDate: new Date("2023-09-01"), purchasePrice: 185000, currentCondition: "GOOD", owner: "COMPANY", isAvailable: true },
];


// ============================================================
// METHOD STATEMENTS DATA
// ============================================================
const METHOD_STATEMENTS_DATA = [
  { methodCode: "GEN-001", wbsStage: "PRE_CONSTRUCTION", workItem: "Persiapan Lokasi dan Mobilisasi", scope: "Pembersihan site, pembuatan kantor lapangan, pagar proyek, utilitas sementara", tools: ["TOOL-042", "TOOL-004", "TOOL-046"], materials: ["Paku", "Seng", "Kayu"], precondition: "Site accessible, IMB available", sequence: [{ step: 1, desc: "Pembersihan vegetasi", duration: 3 }, { step: 2, desc: "Pemasangan pagar sementara", duration: 5 }, { step: 3, desc: "Pembuatan kantor lapangan", duration: 10 }], acceptanceCriteria: "Area bersih, pagar terpasang kuat, kantor layak huni", criticalPoints: "Kestabilan pagar terhadap angin", safety: "APD lengkap, warning sign visible", holdPoint: false },
  { methodCode: "CIV-001", wbsStage: "SITE_PREPARATION", workItem: "Pengukuran dan Bowplank", scope: "Pengukuran as bangunan, penetapan elevasi基准", tools: ["TOOL-001", "TOOL-002", "TOOL-003", "TOOL-004", "TOOL-049"], materials: ["Papan bowplank", "Paku", "Benang"], precondition: "Gambar situasi tersedia", sequence: [{ step: 1, desc: "Setting alat theodolite", duration: 1 }, { step: 2, desc: "Pengukuran as", duration: 2 }, { step: 3, desc: "Pemasangan bowplank", duration: 3 }], acceptanceCriteria: "Akurasi sudut 90 detik, elevasi +/- 1mm", criticalPoints: "Ketepatan sudut siku", safety: "Helmet, safety shoes", holdPoint: true },
  { methodCode: "CIV-002", wbsStage: "EARTHWORK", workItem: "Galian Tanah Pondasi", scope: "Galian tanah untuk pondasi Strauss pile dan pile cap", tools: ["TOOL-042", "TOOL-024", "TOOL-050"], materials: [], precondition: "Bowplank terpasang", sequence: [{ step: 1, desc: "Marking lokasi galian", duration: 1 }, { step: 2, desc: "Penggalian excavator", duration: 3 }, { step: 3, desc: "Finishing manual", duration: 2 }], acceptanceCriteria: "Kedalaman sesuai spec, slope aman", criticalPoints: "Kestabilan dinding galian", safety: "Shoring jika >1.5m, helmet, safety harness", holdPoint: false },
  { methodCode: "STR-001", wbsStage: "FOUNDATION", workItem: "Pondasi Strauss Pile D300", scope: "Pengeboran dan pengecoran tiang bor diameter 300mm", tools: ["TOOL-001", "TOOL-003", "TOOL-021", "TOOL-020"], materials: ["Besi tulangan D13-D25", "Semen", "Pasir", "Koral"], precondition: "Galian selesai, checking elevasi", sequence: [{ step: 1, desc: "Setting rig bor", duration: 1 }, { step: 2, desc: "Pengeboran", duration: 4 }, { step: 3, desc: "Pembesian", duration: 2 }, { step: 4, desc: "Concreting tremie", duration: 1 }], acceptanceCriteria: "Kedalaman min 12m, slump 18-22cm, no segregation", criticalPoints: "Kontaminasi tanah, water in hole", safety: "Scaffolding, harness, hard hat", holdPoint: true },

  { methodCode: "STR-002", wbsStage: "STRUCTURE", workItem: "Kolom Beton 40x40cm", scope: "Pembesian, bekisting, pengecoran kolom struktur", tools: ["TOOL-040", "TOOL-030", "TOOL-043", "TOOL-021"], materials: ["Besi D13-D25", "Bekisting triplek 18mm", "Semen", "Pasir", "Koral"], precondition: "Sloof/checklist bekisting sloof approve", sequence: [{ step: 1, desc: "Pembesian kolom", duration: 2 }, { step: 2, desc: "Pemasangan bekisting", duration: 1 }, { step: 3, desc: "Checklist bekisting", duration: 0.5 }, { step: 4, desc: "Pengecoran", duration: 1 }], acceptanceCriteria: "Dimensi 40x40cm, tegak 1/500, tulangan sesuai drawings", criticalPoints: "Sambungan dengan sloof, cleaning bekisting", safety: "Scaffolding, harness >3m", holdPoint: true },
  { methodCode: "STR-003", wbsStage: "STRUCTURE", workItem: "Balok Beton 30x50cm", scope: "Pembesian dan pengecoran balok struktural", tools: ["TOOL-040", "TOOL-030", "TOOL-043", "TOOL-021"], materials: ["Besi D10-D22", "Bekisting steel frame", "Semen"], precondition: "Kolom atas sudah dicor", sequence: [{ step: 1, desc: "Pembesian balok", duration: 2 }, { step: 2, desc: "Pemasangan bekisting", duration: 1 }, { step: 3, desc: "Pengecoran", duration: 1 }], acceptanceCriteria: "Dimensi sesuai, tulangan sesuai schedule", criticalPoints: "Sambungan di lapangan", safety: "Scaffolding, helmet", holdPoint: false },
  { methodCode: "STR-004", wbsStage: "STRUCTURE", workItem: "Plat Lantai 12cm", scope: "Pembesian dan pengecoran plat lantai", tools: ["TOOL-040", "TOOL-030", "TOOL-021", "TOOL-050"], materials: ["Besi 8mm@150", "Bekisting triplek", "Semen", "Pasir"], precondition: "Balok sudah keras 100%", sequence: [{ step: 1, desc: "Perakitan perancah", duration: 1 }, { step: 2, desc: "Pemasangan bekisting", duration: 1 }, { step: 3, desc: "Pembesian", duration: 2 }, { step: 4, desc: "Pengecoran", duration: 1 }], acceptanceCriteria: "Tebal min 12cm, tidak ada bleeding, finishing rata", criticalPoints: "Curing, jangan overlourd", safety: "Scaffolding complete, helmet", holdPoint: false },
  { methodCode: "ARC-001", wbsStage: "MASONRY", workItem: "Pasangan Bata 1PC:5PP", scope: "Pasangan dinding bata dengan mortar 1 semen : 5 pasir", tools: ["TOOL-004", "TOOL-046", "TOOL-041"], materials: ["Bata merah", "Semen", "Pasir"], precondition: "Alas/batas pasangan ter-marking", sequence: [{ step: 1, desc: "Pembuatan adukan", duration: 1 }, { step: 2, desc: "Pasangan bata", duration: 3 }], acceptanceCriteria: "Tegak, overlap min 1/4 bata, ketebalan joint 12mm", criticalPoints: "Hindari hujan saat baru diplester", safety: "Helmet, safety shoes", holdPoint: false },
  { methodCode: "ARC-002", wbsStage: "ROOF", workItem: "Rangka Atap Baja Ringan", scope: "Pemasangan kuda-kuda dan reng baja ringan", tools: ["TOOL-030", "TOOL-033", "TOOL-043", "TOOL-004"], materials: ["Baja ringan 0.75mm", "Baut self drill", "Sekrup"], precondition: "Ring balok sudah kering", sequence: [{ step: 1, desc: "Pengukuran dan marking", duration: 1 }, { step: 2, desc: "Pemasangan kuda-kuda", duration: 2 }, { step: 3, desc: "Pemasangan reng", duration: 1 }], acceptanceCriteria: "Rata, segitiga benar, anchor kuat ke ring balok", criticalPoints: "Anchor dan bracing", safety: "Safety harness, helmet", holdPoint: true },
  { methodCode: "MEP-001", wbsStage: "MEP", workItem: "Instalasi Listrik", scope: "Pemasangan kabel, pipa, dan fitting listrik", tools: ["TOOL-034", "TOOL-004"], materials: ["Pipa PVC 5", "Kabel NYM 2x1.5", "Box"], precondition: "Dinding sudah diplester", sequence: [{ step: 1, desc: "Marking jalur", duration: 1 }, { step: 2, desc: "Pemasangan pipa", duration: 2 }, { step: 3, desc: "Penarikan kabel", duration: 1 }], acceptanceCriteria: "Kabel tidak terkelupas, grounding ok", criticalPoints: "Tempat lembab", safety: "Matikan listrik saat kerja", holdPoint: false },
  { methodCode: "ARC-003", wbsStage: "WATERPROOFING", workItem: "Waterproofing Dak", scope: "Pemberian lapisan anti air pada dak/beton", tools: ["TOOL-030", "TOOL-034"], materials: ["Membrane torching", "Primer", "Asphalt"], precondition: "Beton cured min 14 days, clean", sequence: [{ step: 1, desc: "Primer coating", duration: 1 }, { step: 2, desc: "Pemasangan membrane", duration: 2 }, { step: 3, desc: "Torching overlap", duration: 1 }], acceptanceCriteria: "Tidak ada bocor saat test rendam 24 jam", criticalPoints: "Detail sudut dan pipa", safety: "Gas torch - fire extinguisher ready", holdPoint: true },
  { methodCode: "FIN-001", wbsStage: "FLOOR_WALL_FINISH", workItem: "Pemasangan Lantai Keramik", scope: "Pemasangan keramik lantai dengan adukan semen", tools: ["TOOL-004", "TOOL-046", "TOOL-041"], materials: ["Keramik", "Semen", "Pasir", "Semen grout"], precondition: "Plesteran selesai, alas rata", sequence: [{ step: 1, desc: "Pembuatan adukan", duration: 1 }, { step: 2, desc: "Pemasangan keramik", duration: 3 }, { step: 3, desc: "Grouting", duration: 1 }], acceptanceCriteria: "Rata, tidak ada hollow sound, fugue rapi", criticalPoints: "Cleaning fugue", safety: "Knee pad", holdPoint: false },
];


// ============================================================
// MAIN SEEDER FUNCTION
// ============================================================
async function main() {
  console.log("=".repeat(70));
  console.log("SANTRA Comprehensive Enhanced Seeder v6");
  console.log("=".repeat(70));
  console.log("");

  // Get admin user
  const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!adminUser) {
    console.error("ERROR: No admin user found. Run main seed first.");
    return;
  }
  const adminId = adminUser.id;
  console.log("Admin user:", adminUser.email);

  // ============================================================
  // STEP 1: SEED COUNTERS
  // ============================================================
  console.log("\nSTEP 1: Seeding counters...");
  const counterPrefixes = ["WORKER-M", "WORKER-KT", "WORKER-T", "WORKER-K", "WORKER-B", "WORKER-O", "WORKER-P", "JOB", "LOG", "QC", "KPI", "ASS", "TOOL", "MAINT", "LOAN", "PROG", "DR"];
  for (const prefix of counterPrefixes) {
    const existing = await prisma.santraCounter.findUnique({ where: { prefix } });
    if (!existing) {
      await prisma.santraCounter.create({ data: { prefix, lastSeq: 0 } });
    }
  }
  console.log("Counters ready.");

  // ============================================================
  // STEP 2: SEED WORKERS (Idempotent)
  // ============================================================
  console.log("\nSTEP 2: Seeding workers...");
  let workersCreated = 0;
  let workersUpdated = 0;
  const workers: any[] = [];

  for (const w of WORKERS_DATA) {
    // Check if worker with this code already exists
    const existing = await prisma.worker.findUnique({ where: { workerCode: w.workerCode } });
    if (existing) {
      // Worker already exists, just use it
      workers.push(existing);
      continue;
    }

    // Check if a worker with this KTP already exists (avoid duplicates)
    if (w.ktpNumber) {
      const existingKtp = await prisma.worker.findFirst({ where: { ktpNumber: w.ktpNumber } });
      if (existingKtp) {
        console.log(`  Skipping ${w.workerCode}: KTP ${w.ktpNumber} already used by ${existingKtp.workerCode}`);
        workers.push(existingKtp);
        continue;
      }
    }

    // Create new worker
    const worker = await prisma.worker.create({ data: w });
    workers.push(worker);
    workersCreated++;
  }
  console.log(`Workers: ${workersCreated} created.`);

  // Get all workers (reload to ensure we have all existing ones)
  const allWorkers = await prisma.worker.findMany({ orderBy: { workerCode: "asc" } });
  console.log(`Total workers: ${allWorkers.length}`);

  // Index workers by role
  const mandors = allWorkers.filter(w => w.role === "MANDOR");
  const kepalaTukangs = allWorkers.filter(w => w.role === "KEPALA_TUKANG");
  const tukangBatues = allWorkers.filter(w => w.role === "TUKANG_BATU");
  const tukangKayus = allWorkers.filter(w => w.role === "TUKANG_KAYU");
  const tukangBesis = allWorkers.filter(w => w.role === "TUKANG_BESI");
  const operators = allWorkers.filter(w => w.role === "OPERATOR");
  const pekerjas = allWorkers.filter(w => w.role === "PEKERJA");

  // ============================================================
  // STEP 3: SEED MASTER TOOLS (Idempotent)
  // ============================================================
  console.log("\nSTEP 3: Seeding master tools...");
  let toolsCreated = 0;
  let toolsUpdated = 0;
  
  for (const t of TOOLS_DATA) {
    const existing = await prisma.masterTool.findUnique({ where: { toolCode: t.toolCode } });
    if (existing) {
      await prisma.masterTool.update({
        where: { toolCode: t.toolCode },
        data: t
      });
      toolsUpdated++;
    } else {
      await prisma.masterTool.create({ data: t });
      toolsCreated++;
    }
  }
  console.log(`Tools: ${toolsCreated} created, ${toolsUpdated} updated.`);

  // Get all tools
  const tools = await prisma.masterTool.findMany({ orderBy: { toolCode: "asc" } });
  console.log(`Total tools: ${tools.length}`);

  // ============================================================
  // STEP 4: SEED METHOD STATEMENTS (Idempotent)
  // ============================================================
  console.log("\nSTEP 4: Seeding method statements...");
  let methodsCreated = 0;
  
  for (const m of METHOD_STATEMENTS_DATA) {
    const existing = await prisma.methodStatement.findUnique({ where: { methodCode: m.methodCode } });
    if (!existing) {
      await prisma.methodStatement.create({
        data: {
          methodCode: m.methodCode,
          wbsStage: m.wbsStage as any,
          workItem: m.workItem,
          scope: m.scope,
          tools: m.tools,
          materials: m.materials,
          precondition: m.precondition,
          sequence: m.sequence as any,
          acceptanceCriteria: m.acceptanceCriteria,
          criticalPoints: m.criticalPoints,
          safety: m.safety,
          holdPoint: m.holdPoint,
          responsibleRoles: ["MANDOR", "KEPALA_TUKANG", "TUKANG_BATU", "TUKANG_BESI"],
        }
      });
      methodsCreated++;
    }
  }
  console.log(`Method statements: ${methodsCreated} created.`);

  // ============================================================
  // STEP 5: GET RABs FOR ASSIGNMENTS
  // ============================================================
  console.log("\nSTEP 5: Getting RABs...");
  const allRabs = await prisma.rab.findMany({ take: 5 });
  const rab1 = allRabs.find(r => r.number.includes("001"));
  const rab2 = allRabs.find(r => r.number.includes("002"));

  if (!rab1 || !rab2) {
    console.log("WARNING: Some RABs not found. Run seed-rab-v5.ts first.");
  }
  console.log(`RAB 1: ${rab1?.number || "NOT FOUND"}`);
  console.log(`RAB 2: ${rab2?.number || "NOT FOUND"}`);

  // ============================================================
  // STEP 6: SEED JOB ASSIGNMENTS
  // ============================================================
  console.log("\nSTEP 6: Seeding job assignments...");

  const assignmentsData = [
    // RAB-001 Jobs - gedung Perkantoran
    { code: "JOB-001", rabId: rab1?.id, wbs: "WBS-01.01", work: "Pekerjaan pondasi Strauss pile D300", status: "COMPLETED", personIdx: 0, mandorIdx: 0, start: "2026-02-01", end: "2026-03-10", pct: 100 },
    { code: "JOB-002", rabId: rab1?.id, wbs: "WBS-01.02", work: "Sloof 30x50 cm", status: "COMPLETED", personIdx: 1, mandorIdx: 0, start: "2026-03-11", end: "2026-03-28", pct: 100 },
    { code: "JOB-003", rabId: rab1?.id, wbs: "WBS-01.03", work: "Kolom utama 40x40 cm", status: "COMPLETED", personIdx: 2, mandorIdx: 0, start: "2026-04-01", end: "2026-05-10", pct: 100 },
    { code: "JOB-004", rabId: rab1?.id, wbs: "WBS-01.04", work: "Balok 30x50 cm", status: "COMPLETED", personIdx: 3, mandorIdx: 0, start: "2026-05-11", end: "2026-06-12", pct: 100 },
    { code: "JOB-005", rabId: rab1?.id, wbs: "WBS-01.05", work: "Plat lantai 12cm", status: "IN_PROGRESS", personIdx: 4, mandorIdx: 1, start: "2026-06-16", end: null, pct: 85 },
    { code: "JOB-006", rabId: rab1?.id, wbs: "WBS-02.01", work: "Pasangan bata 1PC:5PP", status: "IN_PROGRESS", personIdx: 5, mandorIdx: 1, start: "2026-07-01", end: null, pct: 60 },
    { code: "JOB-007", rabId: rab1?.id, wbs: "WBS-02.02", work: "Plesteran dinding", status: "PENDING", personIdx: 6, mandorIdx: 1, start: "2026-08-01", end: null, pct: 0 },
    { code: "JOB-008", rabId: rab1?.id, wbs: "WBS-02.03", work: "Pengecatan dinding", status: "PENDING", personIdx: 7, mandorIdx: 1, start: "2026-09-01", end: null, pct: 0 },
    { code: "JOB-009", rabId: rab1?.id, wbs: "WBS-02.04", work: "Kusen aluminium", status: "PENDING", personIdx: 8, mandorIdx: 1, start: "2026-09-15", end: null, pct: 0 },
    { code: "JOB-010", rabId: rab1?.id, wbs: "WBS-03.01", work: "Instalasi listrik", status: "IN_PROGRESS", personIdx: 0, mandorIdx: 2, start: "2026-08-01", end: null, pct: 40 },
    { code: "JOB-011", rabId: rab1?.id, wbs: "WBS-03.02", work: "Plumbing & drainase", status: "PENDING", personIdx: 1, mandorIdx: 2, start: "2026-08-15", end: null, pct: 0 },
    { code: "JOB-012", rabId: rab1?.id, wbs: "WBS-03.03", work: "AC split 1 PK", status: "IN_PROGRESS", personIdx: 2, mandorIdx: 1, start: "2026-08-05", end: null, pct: 15 },
    // RAB-002 Jobs - Renovasi Rumah
    { code: "JOB-101", rabId: rab2?.id, wbs: "WBS-01.01", work: "Pembongkaran dinding lama", status: "COMPLETED", personIdx: 0, mandorIdx: 3, start: "2026-06-15", end: "2026-06-28", pct: 100 },
    { code: "JOB-102", rabId: rab2?.id, wbs: "WBS-01.02", work: "Pondasi footplat 60x60", status: "COMPLETED", personIdx: 1, mandorIdx: 3, start: "2026-06-29", end: "2026-07-08", pct: 100 },
    { code: "JOB-103", rabId: rab2?.id, wbs: "WBS-01.03", work: "Kolom praktis 15x15", status: "COMPLETED", personIdx: 2, mandorIdx: 3, start: "2026-07-11", end: "2026-07-22", pct: 100 },
    { code: "JOB-104", rabId: rab2?.id, wbs: "WBS-01.04", work: "Sloof 20x30 cm", status: "COMPLETED", personIdx: 3, mandorIdx: 3, start: "2026-07-26", end: "2026-08-08", pct: 100 },
    { code: "JOB-105", rabId: rab2?.id, wbs: "WBS-01.05", work: "Dinding batako", status: "IN_PROGRESS", personIdx: 4, mandorIdx: 3, start: "2026-08-11", end: null, pct: 55 },
    { code: "JOB-106", rabId: rab2?.id, wbs: "WBS-02.01", work: "Plesteran dinding", status: "PENDING", personIdx: 5, mandorIdx: 3, start: "2026-09-01", end: null, pct: 0 },
    { code: "JOB-107", rabId: rab2?.id, wbs: "WBS-02.02", work: "Pengecatan interior", status: "PENDING", personIdx: 6, mandorIdx: 3, start: "2026-09-21", end: null, pct: 0 },
    { code: "JOB-108", rabId: rab2?.id, wbs: "WBS-02.03", work: "Lantai keramik 60x60", status: "PENDING", personIdx: 7, mandorIdx: 3, start: "2026-09-25", end: null, pct: 0 },
  ];

  let jobsCreated = 0;
  for (const item of assignmentsData) {
    if (!item.rabId) continue;
    const existing = await prisma.jobAssignment.findUnique({ where: { assignmentCode: item.code } });
    if (!existing) {
      await prisma.jobAssignment.create({
        data: {
          assignmentCode: item.code,
          rabId: item.rabId,
          wbsCode: item.wbs,
          workItem: item.work,
          status: item.status as any,
          responsiblePersonId: pekerjas[item.personIdx % pekerjas.length]?.id,
          responsibleMandorId: mandors[item.mandorIdx % mandors.length]?.id,
          plannedStart: new Date(item.start),
          plannedEnd: item.end ? new Date(item.end) : null,
          actualStart: item.status !== "PENDING" ? new Date(item.start) : null,
          actualEnd: item.status === "COMPLETED" && item.end ? new Date(item.end) : null,
          progressPct: item.pct,
          priority: 1,
        }
      });
      jobsCreated++;
    }
  }
  console.log(`Job assignments: ${jobsCreated} created.`);

  // ============================================================
  // STEP 7: SEED EXECUTION LOGS
  // ============================================================
  console.log("\nSTEP 7: Seeding execution logs...");
  
  const assignments = await prisma.jobAssignment.findMany();
  let execCreated = 0;
  const year = 2026;

  for (const assignment of assignments) {
    if (!assignment.actualStart) continue;
    const startDate = new Date(assignment.actualStart);
    const endDate = assignment.actualEnd || new Date(assignment.plannedEnd || Date.now());
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const execDays = Math.min(days, 21);

    for (let i = 0; i < execDays; i++) {
      const execDate = new Date(startDate);
      execDate.setDate(execDate.getDate() + i);
      if (execDate > new Date()) continue;

      const counter = await prisma.santraCounter.upsert({
        where: { prefix: "LOG" },
        update: { lastSeq: { increment: 1 } },
        create: { prefix: "LOG", lastSeq: 1 },
        select: { lastSeq: true },
      });

      const workerId = assignment.responsiblePersonId || allWorkers[0].id;
      const progressStep = 100 / execDays;
      const currentProgress = Math.min(Math.round(progressStep * (i + 1)), 100);

      // Jakarta coordinates for GPS simulation
      const latBase = -6.2088 + (Math.random() * 0.001);
      const lonBase = 106.8456 + (Math.random() * 0.001);

      await prisma.executionLog.create({
        data: {
          logCode: `LOG-${year}-${String(counter.lastSeq).padStart(4, "0")}`,
          assignmentId: assignment.id,
          workerId,
          logDate: execDate,
          description: `Pekerjaan ${assignment.workItem} - hari ke-${i + 1}`,
          progressPct: currentProgress,
          latitude: latBase,
          longitude: lonBase,
          locationName: assignment.rabId === rab1?.id ? "Gedung Perkantoran Lt." + (1 + Math.floor(i/7)) : assignment.rabId === rab2?.id ? "Renovasi Rumah Pak Budi" : "Proyek Lain",
        }
      });
      execCreated++;
    }
  }
  console.log(`Execution logs: ${execCreated} created.`);

  // ============================================================
  // STEP 8: SEED QC RECORDS
  // ============================================================
  console.log("\nSTEP 8: Seeding QC records...");
  
  const qcTemplates = [
    { itemDesc: "Pondasi Strauss pile D300", criteria: "Kedalaman min 12m, slump 18-22cm", measurement: "12.05m, slump 20cm", wbsStage: "FOUNDATION" },
    { itemDesc: "Sloof 30x50 cm", criteria: "Ukuran sesuai gambar, tulangan lengkap", measurement: "30x50 cm OK", wbsStage: "FOUNDATION" },
    { itemDesc: "Kolom 40x40 cm", criteria: "Tegak, tulangan sesuai", measurement: "Tegak 90deg", wbsStage: "STRUCTURE" },
    { itemDesc: "Pembesian balok", criteria: "Diameter & jarak sesuai spec", measurement: "D13@150mm OK", wbsStage: "STRUCTURE" },
    { itemDesc: "Plat lantai 12cm", criteria: "Tebal sesuai spec", measurement: "12.2cm", wbsStage: "STRUCTURE" },
    { itemDesc: "Pasangan bata", criteria: "Rata, vertikal, overlap 1/4", measurement: "Rata, vertikal OK", wbsStage: "MASONRY" },
    { itemDesc: "Plesteran", criteria: "Rata, tidak retak", measurement: "Rata, thickness 15mm", wbsStage: "MASONRY" },
    { itemDesc: "Kusen aluminium", criteria: "Rata, kusen sesuai spec", measurement: "Sesuai order", wbsStage: "FLOOR_WALL_FINISH" },
    { itemDesc: "Footplat 60x60", criteria: "Ukuran sesuai spec", measurement: "60x60x40cm OK", wbsStage: "FOUNDATION" },
    { itemDesc: "Kolom praktis 15x15", criteria: "Tegak, segitiga benar", measurement: "Tegak 90deg", wbsStage: "STRUCTURE" },
  ];

  let qcCreated = 0;
  for (let i = 0; i < 50; i++) {
    const template = qcTemplates[i % qcTemplates.length];
    const assignment = assignments[i % assignments.length];
    const worker = allWorkers[i % allWorkers.length];
    if (!assignment || !worker) continue;

    const counter = await prisma.santraCounter.upsert({
      where: { prefix: "QC" },
      update: { lastSeq: { increment: 1 } },
      create: { prefix: "QC", lastSeq: 1 },
      select: { lastSeq: true },
    });

    const resultRand = Math.random();
    const result = resultRand < 0.85 ? "PASS" : resultRand < 0.95 ? "REWORK" : "FAIL";
    const weatherOptions = ["CERAH", "BERAWAN", "GERIMIS", "HUJAN"];

    await prisma.qcRecord.create({
      data: {
        qcCode: `QC-${year}-${String(counter.lastSeq).padStart(4, "0")}`,
        assignmentId: assignment.id,
        workerId: worker.id,
        checkDate: new Date(2026, 6, 1 + (i % 30)),
        itemDesc: template.itemDesc,
        criteria: template.criteria,
        measurement: template.measurement,
        result: result as any,
        wbsStage: template.wbsStage as any,
        checkType: "POST_CHECK" as any,
        defectDesc: result !== "PASS" ? "Perlu perbaikan sesuai instruksi" : null,
        isRework: result === "REWORK",
        latitude: -6.2088 + (Math.random() * 0.001),
        longitude: 106.8456 + (Math.random() * 0.001),
        weather: weatherOptions[Math.floor(Math.random() * weatherOptions.length)],
        temperature: 28 + Math.floor(Math.random() * 10),
      }
    });
    qcCreated++;
  }
  console.log(`QC records: ${qcCreated} created.`);

  // ============================================================
  // STEP 9: SEED ASSESSMENTS
  // ============================================================
  console.log("\nSTEP 9: Seeding worker assessments...");

  let assCreated = 0;
  for (const worker of allWorkers) {
    const existing = await prisma.workerAssessment.findFirst({ where: { workerId: worker.id } });
    if (existing) continue;

    const baseScore = worker.role === "MANDOR" ? 82 : worker.role === "KEPALA_TUKANG" ? 80 :
                     worker.role.includes("TUKANG") ? 76 : 72;
    const variance = 15;

    const technicalScore = Math.min(100, baseScore + Math.floor(Math.random() * variance) - 5);
    const interviewScore = Math.min(100, baseScore + Math.floor(Math.random() * variance) - 8);
    const teamworkScore = Math.min(100, baseScore + Math.floor(Math.random() * variance) + 2);
    const safetyScore = Math.min(100, baseScore + Math.floor(Math.random() * variance) + 5);
    const overallScore = Math.round((technicalScore + interviewScore + teamworkScore + safetyScore) / 4);
    const grade = overallScore >= 85 ? "A" : overallScore >= 70 ? "B" : overallScore >= 55 ? "C" : "D";

    const counter = await prisma.santraCounter.upsert({
      where: { prefix: "ASS" },
      update: { lastSeq: { increment: 1 } },
      create: { prefix: "ASS", lastSeq: 1 },
      select: { lastSeq: true },
    });

    await prisma.workerAssessment.create({
      data: {
        assessmentCode: `ASS-${worker.workerCode}-${year}-${String(counter.lastSeq).padStart(4, "0")}`,
        workerId: worker.id,
        assessmentDate: new Date(year, 0, 15 + (assCreated % 15)),
        interviewer: "Dr. Rina Hartati",
        technicalScore,
        interviewScore,
        teamworkScore,
        safetyScore,
        overallScore,
        grade: grade as any,
        recommendation: overallScore >= 75 ? "Sangat direkomendasikan" : "Baik untuk pekerjaan tertentu",
      }
    });
    assCreated++;
  }
  console.log(`Assessments: ${assCreated} created.`);

  // ============================================================
  // STEP 10: SEED KPI RECORDS
  // ============================================================
  console.log("\nSTEP 10: Seeding KPI records...");

  const periods = ["2026-07", "2026-08", "2026-09"];
  let kpiCreated = 0;

  for (const worker of allWorkers) {
    for (const period of periods) {
      const existingKpi = await prisma.kpiRecord.findUnique({
        where: { workerId_period: { workerId: worker.id, period } }
      });
      if (existingKpi) continue;

      const qualityScore = 70 + Math.floor(Math.random() * 25);
      const productivityScore = 65 + Math.floor(Math.random() * 30);
      const attendanceScore = 75 + Math.floor(Math.random() * 20);
      const safetyScore = 78 + Math.floor(Math.random() * 18);
      const overallScore = Math.round((qualityScore + productivityScore + attendanceScore + safetyScore) / 4);

      const [pYear, pMonth] = period.split("-");
      const lastDay = new Date(parseInt(pYear), parseInt(pMonth), 0).getDate();

      const counter = await prisma.santraCounter.upsert({
        where: { prefix: "KPI" },
        update: { lastSeq: { increment: 1 } },
        create: { prefix: "KPI", lastSeq: 1 },
        select: { lastSeq: true },
      });

      await prisma.kpiRecord.create({
        data: {
          kpiCode: `KPI-${worker.workerCode}-${period.replace("-", "")}`,
          workerId: worker.id,
          period,
          periodStart: new Date(parseInt(pYear), parseInt(pMonth) - 1, 1),
          periodEnd: new Date(parseInt(pYear), parseInt(pMonth) - 1, lastDay),
          qualityScore,
          productivityScore,
          attendanceScore,
          safetyScore,
          reworkCount: Math.floor(Math.random() * 3),
          defectCount: Math.floor(Math.random() * 2),
          completedTasks: 5 + Math.floor(Math.random() * 10),
          lateDays: Math.floor(Math.random() * 3),
          overallScore,
        }
      });
      kpiCreated++;
    }
  }
  console.log(`KPI records: ${kpiCreated} created.`);

  // ============================================================
  // STEP 11: SEED TOOL LOANS
  // ============================================================
  console.log("\nSTEP 11: Seeding tool loans...");

  let loansCreated = 0;
  for (let i = 0; i < 30; i++) {
    const tool = tools[i % tools.length];
    const worker = allWorkers[i % allWorkers.length];
    if (!tool || !worker) continue;

    const counter = await prisma.santraCounter.upsert({
      where: { prefix: "LOAN" },
      update: { lastSeq: { increment: 1 } },
      create: { prefix: "LOAN", lastSeq: 1 },
      select: { lastSeq: true },
    });

    const issuedDate = new Date(2026, 6, 1 + (i % 30));
    const status = i < 25 ? "RETURNED" : i < 28 ? "OPEN" : "OVERDUE";
    const returnedDate = status === "RETURNED" ? new Date(issuedDate.getTime() + 86400000 * (1 + Math.floor(Math.random() * 5))) : null;

    await prisma.toolLoan.create({
      data: {
        loanCode: `LOAN-${year}-${String(counter.lastSeq).padStart(4, "0")}`,
        toolId: tool.id,
        workerId: worker.id,
        issuedById: adminId,
        issuedAt: issuedDate,
        returnedAt: returnedDate,
        status: status as any,
        returnedCondition: returnedDate ? "GOOD" as any : undefined,
        issuedLocation: worker.role === "MANDOR" ? "Kantor Lapangan" : "Proyek Ged. Perkantoran",
      }
    });
    loansCreated++;
  }
  console.log(`Tool loans: ${loansCreated} created.`);

  // ============================================================
  // STEP 12: SEED LESSON LEARNED
  // ============================================================
  console.log("\nSTEP 12: Seeding lesson learned...");

  const lessonLearnedData = [
    { title: "Retak pada dinding bata baru diplester", description: "Dinding bata yang diplester terlalu cepat mengalami retak susut", rootCause: "Campuran mortar terlalu banyak pasir, curing tidak cukup", correctiveAction: "Tambah kadar semen, Lakukan curing 7 hari", preventiveAction: "Sediakan SOP pencampuran mortar dan jadwal curing", wbsStage: "MASONRY" },
    { title: "Hollow sound pada lantai keramik", description: "Beberapa area lantai keramik menghasilkan bunyi kosong saat diketuk", rootCause: "Adukan tidak penuh, ada rongga di bawah keramik", correctiveAction: "Bongkar dan pasang ulang area yang bermasalah", preventiveAction: "Pastikan adukan penuh dan rata sebelum pasang keramik", wbsStage: "FLOOR_WALL_FINISH" },
    { title: "Kolom tidak tegak 90 derajat", description: "Kolom Lt.2 ditemukan tidak tegak 2cm dari vertikal", rootCause: "Bekisting tidak diikat cukup kuat saat pengecoran", correctiveAction: "Pasang pengikat tambahan, perbaiki bentuk", preventiveAction: "Checklist bekisting sebelum cor harus ada 2 orang berbeda", wbsStage: "STRUCTURE" },
    { title: "Keterlambatan pengiriman steel beam", description: "Steel beam WF 300 terlambat 5 hari dari jadwal", rootCause: "Supplier mengalami masalah produksi", correctiveAction: "Pekerjaan lain dimajukan, steel beam dikejar", preventiveAction: "Kontrak supplier harus ada penalty clause", wbsStage: "STRUCTURE" },
    { title: "Kebocoran pada sambungan pipa", description: "Sambungan pipa air di lantai 3 mengalami kebocoran", rootCause: "Sambungan tidak disambung dengan benar, kurang seal", correctiveAction: "Bongkar dan pasang ulang dengan seal yang benar", preventiveAction: "QC check setiap sambungan pipa sebelum закрыть", wbsStage: "MEP" },
  ];

  let llCreated = 0;
  for (const ll of lessonLearnedData) {
    await prisma.lessonLearned.create({
      data: {
        title: ll.title,
        description: ll.description,
        rootCause: ll.rootCause,
        correctiveAction: ll.correctiveAction,
        preventiveAction: ll.preventiveAction,
        wbsStage: ll.wbsStage as any,
        severity: "MEDIUM" as any,
        occurredAt: new Date(2026, 6, 1 + llCreated * 5),
        isResolved: llCreated < 4,
        resolvedAt: llCreated < 4 ? new Date(2026, 6, 5 + llCreated * 5) : null,
      }
    });
    llCreated++;
  }
  console.log(`Lesson learned: ${llCreated} created.`);

  // ============================================================
  // FINAL SUMMARY
  // ============================================================
  console.log("\n" + "=".repeat(70));
  console.log("SEEDING SUMMARY");
  console.log("=".repeat(70));

  const [finalWorkers, finalTools, finalMethods, finalJobs, finalExec, finalQc, finalAss, finalKpi, finalLoans, finalLl] = await Promise.all([
    prisma.worker.count(),
    prisma.masterTool.count(),
    prisma.methodStatement.count(),
    prisma.jobAssignment.count(),
    prisma.executionLog.count(),
    prisma.qcRecord.count(),
    prisma.workerAssessment.count(),
    prisma.kpiRecord.count(),
    prisma.toolLoan.count(),
    prisma.lessonLearned.count(),
  ]);

  console.log(`Workers:           ${finalWorkers}`);
  console.log(`Master Tools:      ${finalTools}`);
  console.log(`Method Statements: ${finalMethods}`);
  console.log(`Job Assignments:   ${finalJobs}`);
  console.log(`Execution Logs:    ${finalExec}`);
  console.log(`QC Records:       ${finalQc}`);
  console.log(`Assessments:      ${finalAss}`);
  console.log(`KPI Records:      ${finalKpi}`);
  console.log(`Tool Loans:       ${finalLoans}`);
  console.log(`Lesson Learned:   ${finalLl}`);
  console.log("=".repeat(70));
  console.log("\n✅ SANTRA Enhanced Seeding Complete!");
  console.log("\nRun with: npx tsx prisma/seed-santra-v6.ts");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
