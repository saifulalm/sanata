/**
 * Tipe dan konstanta domain estimasi biaya yang dipakai bersama oleh Server dan
 * Client Component. Sengaja dipisah dari `adminResources.ts` (yang `server-only`)
 * supaya mengimpor label di komponen klien tidak ikut menarik modul server.
 */

export type ResourceType = "LABOR" | "MATERIAL" | "EQUIPMENT";

export const RESOURCE_TYPE_LABEL: Record<ResourceType, string> = {
  LABOR: "Upah",
  MATERIAL: "Bahan",
  EQUIPMENT: "Alat",
};

export type RabStatus = "DRAFT" | "REVIEW" | "APPROVED" | "REJECTED" | "ARCHIVED";

export const RAB_STATUS_LABEL: Record<RabStatus, string> = {
  DRAFT: "Draf",
  REVIEW: "Ditinjau",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
  ARCHIVED: "Diarsipkan",
};

export interface PriceItem {
  id: string;
  code: string;
  name: string;
  type: ResourceType;
  unit: string;
  unitPrice: string;
  region: string | null;
  isActive: boolean;
}

export interface AhspComponentLine {
  id: string;
  priceItemId: string;
  code: string;
  name: string;
  type: ResourceType;
  unit: string;
  unitPrice: string;
  coefficient: string;
  subtotal: string;
}

export interface Ahsp {
  id: string;
  code: string;
  name: string;
  unit: string;
  category: string | null;
  overheadPct: string;
  notes: string | null;
  isActive: boolean;
  components: { id: string; priceItemId: string; coefficient: string; order: number; priceItem: PriceItem }[];
  computed: {
    lines: AhspComponentLine[];
    breakdown: { labor: string; material: string; equipment: string };
    directCost: string;
    overheadAmount: string;
    unitPrice: string;
  };
}

export interface RabItem {
  id: string;
  ahspId: string | null;
  description: string;
  unit: string;
  volume: string;
  unitPrice: string;
  amount: string;
  order: number;
}

export interface RabSection {
  id: string;
  name: string;
  order: number;
  items: RabItem[];
}

export interface RabListRow {
  id: string;
  number: string;
  title: string;
  clientName: string | null;
  location: string | null;
  status: RabStatus;
  total: string;
  createdAt: string;
  createdBy: { id: string; name: string };
  _count: { sections: number };
}

export interface Rab {
  id: string;
  number: string;
  title: string;
  clientName: string | null;
  location: string | null;
  projectDate: string | null;
  status: RabStatus;
  taxPct: string;
  discountPct: string;
  notes: string | null;
  subtotal: string;
  discountAmount: string;
  taxAmount: string;
  total: string;
  createdAt: string;
  createdBy: { id: string; name: string; email: string };
  sections: RabSection[];
  sectionSummary: { id: string; name: string; total: string; weightPct: string }[];
}

export interface RabTakeoffLine {
  priceItemId: string;
  code: string;
  name: string;
  type: ResourceType;
  unit: string;
  unitPrice: string;
  quantity: string;
  amount: string;
  usedIn: { description: string; volume: string; coefficient: string; subtotal: string }[];
}

export interface RabTakeoff {
  rab: { id: string; number: string; title: string; total: string };
  lines: RabTakeoffLine[];
  unresolved: { description: string; unit: string; volume: string; amount: string }[];
  composition: {
    labor: string;
    material: string;
    equipment: string;
    directTotal: string;
    laborPct: string;
    materialPct: string;
    equipmentPct: string;
  };
}

// --- Jadwal pelaksanaan & kurva S -------------------------------------------

/** Satu periode mingguan pada kurva S. */
export interface ScheduleBucket {
  index: number;
  startDate: string;
  endDate: string;
  plannedPct: string;
  actualPct: string;
  plannedValue: string;
  actualValue: string;
  /** Bobot kumulatif rencana (% dari total). */
  cumulativePlanned: number;
  /** Bobot kumulatif aktual (% dari total). */
  cumulativeActual: number;
  /** Realisasi dikurangi rencana; negatif berarti terlambat. */
  deviationPct: string;
}

export interface ScheduleItemLine {
  id: string;
  sectionId: string;
  sectionName: string;
  description: string;
  unit: string;
  volume: string;
  amount: string;
  weightPct: string;
  startOffsetDays: number;
  durationDays: number;
  startDate: string | null;
  endDate: string | null;
  progressPct: string;
  lastProgressDate: string | null;
}

export interface ScheduleHoliday {
  id?: string;
  date: string;
  name: string;
}

export interface RabSchedule {
  rab: {
    id: string;
    number: string;
    title: string;
    subtotal: string;
    scheduleStart: string | null;
    scheduleEnd: string | null;
    /** 0 = Minggu … 6 = Sabtu. */
    restDays: number[];
    totalWorkingDays: number;
    totalCalendarDays: number;
    scheduledItems: number;
    totalItems: number;
  };
  holidays: ScheduleHoliday[];
  items: ScheduleItemLine[];
  buckets: ScheduleBucket[];
}

export type ProgressStatus = "PENDING" | "APPROVED" | "REJECTED";

export const PROGRESS_STATUS_LABEL: Record<ProgressStatus, string> = {
  PENDING: "Menunggu Pemeriksaan",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
};

export interface ProgressPhoto {
  id: string;
  url: string;
  caption: string | null;
}

export interface ProgressEntry {
  id: string;
  itemId: string;
  itemDescription: string;
  sectionName: string;
  date: string;
  percent: string;
  note: string | null;
  status: ProgressStatus;
  rejectReason: string | null;
  createdByName: string | null;
  approvedByName: string | null;
  approvedAt: string | null;
  photos: ProgressPhoto[];
}

export interface ScheduleBaseline {
  id: string;
  name: string;
  capturedAt: string;
  capturedByName: string | null;
  scheduleStart: string | null;
  totalWorkingDays: number;
  buckets: { index: number; endDate: string; plannedPct: string }[];
}

/** Label untuk kolom tabel kurva S / baseline. */
export const S_CURVE_DATA_LABEL: { key: string; label: string }[] = [
  { key: "plannedPct", label: "Rencana (%)" },
  { key: "cumulativePlanned", label: "Kumulatif Rencana" },
  { key: "plannedTotal", label: "Rencana Total (%)" },
  { key: "actualPct", label: "Realisasi (%)" },
  { key: "cumulativeActual", label: "Kumulatif Aktual" },
  { key: "actualTotal", label: "Realisasi Total (%)" },
  { key: "gap", label: "Gap (%)" },
];

// --- Laporan harian lapangan -------------------------------------------------

export type Weather = "CERAH" | "BERAWAN" | "GERIMIS" | "HUJAN" | "HUJAN_LEBAT";

export const WEATHER_LABEL: Record<Weather, string> = {
  CERAH: "Cerah",
  BERAWAN: "Berawan",
  GERIMIS: "Gerimis",
  HUJAN: "Hujan",
  HUJAN_LEBAT: "Hujan Lebat",
};

export interface DailyReportPhoto {
  id: string;
  url: string;
  caption: string | null;
  location: string | null;
}

export interface DailyReport {
  id: string;
  rabId: string;
  date: string;
  weatherMorning: Weather | null;
  weatherAfternoon: Weather | null;
  workforce: Record<string, number> | null;
  workforceTotal: number;
  equipment: string | null;
  materials: string | null;
  activities: string;
  obstacles: string | null;
  notes: string | null;
  createdByName: string | null;
  createdAt: string;
  photos: DailyReportPhoto[];
}

// --- Termin / progress billing ------------------------------------------------

export type BillingStatus = "DRAFT" | "ISSUED" | "PAID" | "CANCELLED";

export const BILLING_STATUS_LABEL: Record<BillingStatus, string> = {
  DRAFT: "Draf",
  ISSUED: "Terkirim",
  PAID: "Dibayar",
  CANCELLED: "Dibatalkan",
};

export interface BillingLine {
  itemId: string;
  sectionName: string;
  description: string;
  unit: string;
  volume: string;
  amount: string;
  percent: string;
  value: string;
}

export interface BillingTotals {
  cumulativeValue: string;
  previousValue: string;
  currentValue: string;
  retentionPct: string;
  retentionAmount: string;
  taxPct: string;
  taxAmount: string;
  netAmount: string;
}

export interface BillingPreview extends BillingTotals {
  periodEnd: string;
  lines: BillingLine[];
}

export interface ProgressBilling extends BillingTotals {
  id: string;
  rabId: string;
  number: string;
  status: BillingStatus;
  periodEnd: string;
  notes: string | null;
  createdAt: string;
  lines: BillingLine[];
}

// --- Surat Penawaran Harga (SPH) --------------------------------------------

export type QuotationStatus = "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "CANCELLED";

export const QUOTATION_STATUS_LABEL: Record<QuotationStatus, string> = {
  DRAFT: "Draf",
  SENT: "Terkirim",
  ACCEPTED: "Diterima",
  REJECTED: "Ditolak",
  CANCELLED: "Dibatalkan",
};

export interface PaymentTerm {
  label: string;
  percent: number;
}

export interface QuotationSnapshot {
  rabNumber: string;
  rabTitle: string;
  location: string | null;
  taxPct: string;
  discountPct: string;
  sections: {
    name: string;
    total: string;
    items: { description: string; unit: string; volume: string; unitPrice: string; amount: string }[];
  }[];
}

export interface QuotationListRow {
  id: string;
  number: string;
  status: QuotationStatus;
  isExpired: boolean;
  subject: string;
  clientName: string;
  total: string;
  validUntil: string;
  createdAt: string;
  createdBy: { id: string; name: string };
  rab: { id: string; number: string } | null;
}

export interface Quotation {
  id: string;
  number: string;
  status: QuotationStatus;
  isExpired: boolean;
  clientName: string;
  clientCompany: string | null;
  clientAddress: string | null;
  attentionTo: string | null;
  subject: string;
  openingNote: string | null;
  closingNote: string | null;
  terms: string | null;
  paymentTerms: PaymentTerm[] | null;
  issuedAt: string;
  validUntil: string;
  sentAt: string | null;
  decidedAt: string | null;
  signerName: string;
  signerTitle: string;
  signatoryId: string | null;
  snapshot: QuotationSnapshot;
  subtotal: string;
  discountAmount: string;
  taxPct: string;
  taxAmount: string;
  total: string;
  createdAt: string;
  createdBy: { id: string; name: string; email: string };
  rab: { id: string; number: string; title: string } | null;
}

export interface QuotationDefaults {
  rab: { id: string; number: string; title: string; clientName: string | null; location: string | null; total: string };
  defaults: {
    subject: string;
    clientName: string;
    terms: string;
    paymentTerms: PaymentTerm[];
    validForDays: number;
    openingNote: string;
    closingNote: string;
  };
}
