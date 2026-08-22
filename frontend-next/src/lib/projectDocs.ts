/**
 * Tipe dan label untuk empat keluarga dokumen proyek.
 *
 * Sengaja terpisah dari `adminResources.ts`, yang ditandai `server-only`:
 * komponen klien butuh label dan bentuk datanya untuk merender formulir, dan
 * mengimpornya dari modul pengambil data akan menyeret token admin ke bundel
 * peramban. Pola yang sama sudah dipakai `estimation.ts`.
 */

// --- Pengajuan ---------------------------------------------------------------

export type SubmissionType = "ALAT" | "MATERIAL" | "WAKTU" | "RENCANA_WAKTU";

export const SUBMISSION_TYPE_LABEL: Record<SubmissionType, string> = {
  ALAT: "Ajuan Alat",
  MATERIAL: "Ajuan Material",
  WAKTU: "Ajuan Waktu",
  RENCANA_WAKTU: "Rencana Waktu",
};

/** Kalimat pendek yang menerangkan ke mana dokumen ini mengalir. */
export const SUBMISSION_TYPE_HINT: Record<SubmissionType, string> = {
  ALAT: "Dari site engineer ke atasan",
  MATERIAL: "Dari site engineer ke atasan",
  WAKTU: "Dari site engineer ke atasan, diteruskan ke klien",
  RENCANA_WAKTU: "Rencana waktu pelaksanaan yang diajukan",
};

export type SubmissionStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED_INTERNAL"
  | "FORWARDED_CLIENT"
  | "APPROVED_CLIENT"
  | "REJECTED"
  | "CANCELLED";

export const SUBMISSION_STATUS_LABEL: Record<SubmissionStatus, string> = {
  DRAFT: "Draf",
  SUBMITTED: "Menunggu atasan",
  APPROVED_INTERNAL: "Disetujui atasan",
  FORWARDED_CLIENT: "Diteruskan ke klien",
  APPROVED_CLIENT: "Disetujui klien",
  REJECTED: "Ditolak",
  CANCELLED: "Dibatalkan",
};

export interface DocAttachment {
  url: string;
  name: string;
}

export interface SubmissionItem {
  id: string;
  name: string;
  spec: string | null;
  unit: string;
  quantity: string;
  unitPrice: string;
  amount: string;
  note: string | null;
}

export interface Submission {
  id: string;
  number: string;
  rabId: string;
  rab: { id: string; number: string; title: string; clientName: string | null };
  type: SubmissionType;
  status: SubmissionStatus;
  title: string;
  reason: string | null;
  neededDate: string | null;
  requestedDays: number | null;
  newTargetDate: string | null;
  estimatedCost: string;
  attachments: DocAttachment[];
  requestedByName: string;
  submittedAt: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  forwardedAt: string | null;
  clientDecidedAt: string | null;
  clientDecidedBy: string | null;
  clientNote: string | null;
  needsClientApproval: boolean;
  isOverdue: boolean;
  items: SubmissionItem[];
  createdAt: string;
  updatedAt: string;
}

// --- Logbook -----------------------------------------------------------------

export type LogbookCategory =
  | "KUNJUNGAN_CLIENT"
  | "KUNJUNGAN_KONSULTAN"
  | "INSTRUKSI_LAPANGAN"
  | "KEAMANAN"
  | "KESALAHAN_KERJA"
  | "KECELAKAAN_KERJA"
  | "KERUSAKAN_ALAT"
  | "GANGGUAN_CUACA"
  | "GANGGUAN_WARGA"
  | "LAINNYA";

export const LOGBOOK_CATEGORY_LABEL: Record<LogbookCategory, string> = {
  KUNJUNGAN_CLIENT: "Kunjungan klien",
  KUNJUNGAN_KONSULTAN: "Kunjungan konsultan",
  INSTRUKSI_LAPANGAN: "Instruksi lapangan",
  KEAMANAN: "Gangguan keamanan",
  KESALAHAN_KERJA: "Kesalahan kerja",
  KECELAKAAN_KERJA: "Kecelakaan kerja",
  KERUSAKAN_ALAT: "Kerusakan alat",
  GANGGUAN_CUACA: "Gangguan cuaca",
  GANGGUAN_WARGA: "Gangguan warga",
  LAINNYA: "Lainnya",
};

export type LogbookSeverity = "INFO" | "RINGAN" | "SEDANG" | "BERAT" | "KRITIS";

export const LOGBOOK_SEVERITY_LABEL: Record<LogbookSeverity, string> = {
  INFO: "Info",
  RINGAN: "Ringan",
  SEDANG: "Sedang",
  BERAT: "Berat",
  KRITIS: "Kritis",
};

export interface LogbookEntry {
  id: string;
  rabId: string;
  date: string;
  timeOfDay: string | null;
  category: LogbookCategory;
  severity: LogbookSeverity;
  title: string;
  description: string;
  involvedParty: string | null;
  actionTaken: string | null;
  followUp: string | null;
  isResolved: boolean;
  resolvedAt: string | null;
  attachments: DocAttachment[];
  createdByName: string | null;
  createdAt: string;
}

export interface LogbookBoardData {
  rab: { id: string; number: string; title: string };
  entries: LogbookEntry[];
  summary: { total: number; unresolved: number; criticalOpen: number };
}

// --- Site memo ---------------------------------------------------------------

export type MemoDirection = "INCOMING" | "OUTGOING";

export const MEMO_DIRECTION_LABEL: Record<MemoDirection, string> = {
  INCOMING: "Surat Masuk",
  OUTGOING: "Surat Keluar",
};

export type MemoCategory =
  | "KOMPLAIN"
  | "INSTRUKSI"
  | "TEGURAN"
  | "PERMINTAAN_INFO"
  | "KLARIFIKASI"
  | "APPROVAL"
  | "ADDENDUM"
  | "LAINNYA";

export const MEMO_CATEGORY_LABEL: Record<MemoCategory, string> = {
  KOMPLAIN: "Komplain",
  INSTRUKSI: "Instruksi",
  TEGURAN: "Teguran",
  PERMINTAAN_INFO: "Permintaan informasi",
  KLARIFIKASI: "Klarifikasi",
  APPROVAL: "Approval",
  ADDENDUM: "Addendum",
  LAINNYA: "Lainnya",
};

export type MemoStatus = "OPEN" | "IN_PROGRESS" | "ANSWERED" | "CLOSED";

export const MEMO_STATUS_LABEL: Record<MemoStatus, string> = {
  OPEN: "Belum ditangani",
  IN_PROGRESS: "Sedang ditangani",
  ANSWERED: "Sudah dibalas",
  CLOSED: "Selesai",
};

export interface MemoRef {
  id: string;
  number: string;
  subject: string;
  letterDate: string;
  direction?: MemoDirection;
}

export interface SiteMemo {
  id: string;
  number: string;
  rabId: string;
  rab: { id: string; number: string; title: string; clientName: string | null };
  direction: MemoDirection;
  category: MemoCategory;
  status: MemoStatus;
  subject: string;
  body: string;
  fromParty: string;
  toParty: string;
  letterDate: string;
  handledAt: string | null;
  dueDate: string | null;
  closedAt: string | null;
  daysOverdue: number;
  isOverdue: boolean;
  parentId: string | null;
  parent: MemoRef | null;
  replies: MemoRef[];
  attachments: DocAttachment[];
  createdByName: string | null;
  createdAt: string;
}

export interface MemoBoardData {
  rab: { id: string; number: string; title: string; clientName: string | null };
  memos: SiteMemo[];
  summary: { incoming: number; outgoing: number; open: number; overdue: number };
}

// --- Surat-menyurat ----------------------------------------------------------

export type LetterType = "SPK" | "INVOICE" | "KWITANSI" | "BAPP" | "BAST";

export const LETTER_TYPE_LABEL: Record<LetterType, string> = {
  SPK: "SPK",
  INVOICE: "Invoice",
  KWITANSI: "Kwitansi",
  BAPP: "BAPP",
  BAST: "BAST",
};

export const LETTER_TYPE_FULL: Record<LetterType, string> = {
  SPK: "Surat Perjanjian Kerja",
  INVOICE: "Invoice",
  KWITANSI: "Kwitansi",
  BAPP: "Berita Acara Penyelesaian Pekerjaan",
  BAST: "Berita Acara Serah Terima",
};

export const LETTER_TYPE_HINT: Record<LetterType, string> = {
  SPK: "Otomatis dari penawaran yang diterima, nomor unik tiap surat",
  INVOICE: "Otomatis dari termin, nomor tidak boleh sama",
  KWITANSI: "Tanda terima pembayaran atas invoice",
  BAPP: "Berita acara penyelesaian pekerjaan",
  BAST: "Berita acara serah terima",
};

export type LetterStatus = "DRAFT" | "ISSUED" | "SIGNED" | "PAID" | "CANCELLED";

export const LETTER_STATUS_LABEL: Record<LetterStatus, string> = {
  DRAFT: "Draf",
  ISSUED: "Terbit",
  SIGNED: "Ditandatangani",
  PAID: "Lunas",
  CANCELLED: "Dibatalkan",
};

export interface LetterClause {
  title: string;
  text: string;
}

export interface LetterLine {
  description: string;
  unit?: string | null;
  quantity?: number | null;
  unitPrice?: number | null;
  amount: number;
}

export interface LetterBody {
  clauses?: LetterClause[];
  lines?: LetterLine[];
  opening?: string | null;
  closing?: string | null;
  fields?: Record<string, string>;
}

export interface ProjectLetter {
  id: string;
  number: string;
  type: LetterType;
  typeLabel: string;
  status: LetterStatus;
  rabId: string;
  rab: { id: string; number: string; title: string; clientName: string | null; location: string | null };
  subject: string;
  letterDate: string;
  issuedAt: string | null;
  signedAt: string | null;
  paidAt: string | null;
  dueDate: string | null;
  isOverdue: boolean;
  recipientName: string;
  recipientCompany: string | null;
  recipientAddress: string | null;
  attentionTo: string | null;
  signerName: string;
  signerTitle: string;
  signatoryId: string | null;
  counterSignerName: string | null;
  counterSignerTitle: string | null;
  amount: string;
  retentionAmount: string;
  taxPct: string;
  taxAmount: string;
  totalAmount: string;
  amountInWords: string | null;
  body: LetterBody;
  billing: { id: string; number: string; periodEnd: string; netAmount: string } | null;
  quotation: { id: string; number: string; subject: string } | null;
  parentLetter: { id: string; number: string; type: LetterType; subject: string } | null;
  childLetters: { id: string; number: string; type: LetterType; status: LetterStatus }[];
  notes: string | null;
  attachments: DocAttachment[];
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LetterBoardData {
  rab: { id: string; number: string; title: string; clientName: string | null };
  letters: ProjectLetter[];
  summary: {
    total: number;
    drafts: number;
    overdueInvoices: number;
    invoicedTotal: string;
    paidTotal: string;
  };
}

/** Nilai bawaan formulir surat, hasil tarikan otomatis dari data yang ada. */
export interface LetterDefaults {
  rabId: string;
  type: LetterType;
  letterDate: string;
  subject: string;
  recipientName: string;
  recipientCompany: string;
  attentionTo: string | null;
  signerName: string;
  signerTitle: string;
  counterSignerName?: string;
  counterSignerTitle?: string;
  amount: number;
  retentionAmount: number;
  taxPct: number;
  dueDate: string | null;
  billingId?: string | null;
  quotationId?: string | null;
  parentLetterId?: string | null;
  body: LetterBody;
}

export interface LetterDefaultsResponse {
  rab: { id: string; number: string; title: string; clientName: string | null; location: string | null };
  defaults: LetterDefaults;
}

// --- Laporan mingguan & bulanan ----------------------------------------------

export interface PeriodSummary {
  key: string;
  label: string;
  startDate: string;
  endDate: string;
  reportedDays: number;
  calendarDays: number;
  missingDates: string[];
  weatherTally: Record<string, number>;
  averageWorkforce: number;
  peakWorkforce: number;
  photoCount: number;
  activities: { date: string; text: string }[];
  obstacles: { date: string; text: string }[];
  cumulativePct: string;
  previousPct: string;
  progressPct: string;
  cumulativeValue: string;
  plannedPct: string;
  deviationPct: string;
  logbookCount: number;
  criticalLogbook: { date: string; title: string; severity: string }[];
}

export interface PeriodicReportData {
  rab: {
    id: string;
    number: string;
    title: string;
    clientName: string | null;
    location: string | null;
    subtotal: string;
    scheduleStart: string | null;
    scheduleEnd: string | null;
  };
  periods: PeriodSummary[];
}

// --- Warna status ------------------------------------------------------------

export type Tone = "neutral" | "success" | "warning" | "danger" | "info";

export const SUBMISSION_STATUS_TONE: Record<SubmissionStatus, Tone> = {
  DRAFT: "neutral",
  SUBMITTED: "warning",
  APPROVED_INTERNAL: "info",
  FORWARDED_CLIENT: "info",
  APPROVED_CLIENT: "success",
  REJECTED: "danger",
  CANCELLED: "neutral",
};

export const MEMO_STATUS_TONE: Record<MemoStatus, Tone> = {
  OPEN: "warning",
  IN_PROGRESS: "info",
  ANSWERED: "success",
  CLOSED: "neutral",
};

export const LETTER_STATUS_TONE: Record<LetterStatus, Tone> = {
  DRAFT: "neutral",
  ISSUED: "info",
  SIGNED: "success",
  PAID: "success",
  CANCELLED: "danger",
};

export const LOGBOOK_SEVERITY_TONE: Record<LogbookSeverity, Tone> = {
  INFO: "neutral",
  RINGAN: "info",
  SEDANG: "warning",
  BERAT: "danger",
  KRITIS: "danger",
};
