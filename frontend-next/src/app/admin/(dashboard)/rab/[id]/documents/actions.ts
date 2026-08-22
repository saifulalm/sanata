"use server";

import { revalidatePath } from "next/cache";
import { adminFetch, AdminApiError } from "@/lib/adminApi";
import type {
  DocAttachment,
  LetterBody,
  LetterDefaults,
  LetterStatus,
  LetterType,
  LogbookCategory,
  LogbookSeverity,
  MemoCategory,
  MemoDirection,
  MemoStatus,
  SubmissionType,
} from "@/lib/projectDocs";

/**
 * Server action untuk seluruh dokumen proyek.
 *
 * Semuanya mengembalikan `Result` alih-alih melempar: form dokumen sering
 * ditolak karena aturan alur — surat yang sudah terbit tidak boleh disunting,
 * ajuan waktu belum boleh diteruskan — dan pesan dari server itulah yang paling
 * berguna bagi pemakai. Melemparnya hanya akan memunculkan layar galat yang
 * kehilangan seluruh isian yang sudah diketik.
 */
type Result = { ok: boolean; message?: string };

function fail(err: unknown, fallback: string): Result {
  return { ok: false, message: err instanceof AdminApiError ? err.message : fallback };
}

/**
 * Buang field yang tidak boleh ikut saat menyunting.
 *
 * Beberapa field hanya bermakna pada saat dokumen dibuat — proyek, jenis, arah
 * surat — karena menentukan rangkaian nomor atau kaitan antar dokumen. API
 * memang sudah menolaknya, tapi mengirimnya lalu diabaikan diam-diam membuat
 * formulir tampak menyimpan sesuatu yang sebenarnya tidak berubah.
 */
function omit<T extends object, K extends keyof T>(source: T, keys: K[]): Omit<T, K> {
  const copy = { ...source };
  for (const key of keys) delete copy[key];
  return copy;
}

/** Semua halaman dokumen satu proyek disegarkan bersama: angka ringkasannya saling terkait. */
function revalidateProject(rabId: string) {
  for (const path of ["submissions", "memos", "letters", "logbook", "reports", "overview"]) {
    revalidatePath(`/admin/rab/${rabId}/${path}`);
  }
  revalidatePath("/admin/submissions");
}

// --- Pengajuan ---------------------------------------------------------------

export interface SubmissionItemPayload {
  name: string;
  spec: string | null;
  unit: string;
  quantity: number;
  unitPrice: number;
  note: string | null;
}

export interface SubmissionPayload {
  rabId: string;
  type: SubmissionType;
  title: string;
  reason: string | null;
  neededDate: string | null;
  requestedDays: number | null;
  newTargetDate: string | null;
  items: SubmissionItemPayload[];
  attachments: DocAttachment[];
}

export async function saveSubmissionAction(
  payload: SubmissionPayload,
  id?: string
): Promise<Result & { id?: string }> {
  try {
    if (id) {
      // Jenis dan proyek tidak ikut dikirim saat menyunting: keduanya menentukan
      // rangkaian nomor dokumen, dan nomor yang sudah terbit tidak boleh pindah.
      await adminFetch(`/submissions/${id}`, { method: "PUT", body: JSON.stringify(omit(payload, ["rabId", "type"])) });
      revalidateProject(payload.rabId);
      return { ok: true, id };
    }

    const created = await adminFetch<{ data: { id: string } }>("/submissions", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    revalidateProject(payload.rabId);
    return { ok: true, id: created.data.id };
  } catch (err) {
    return fail(err, "Gagal menyimpan pengajuan");
  }
}

async function submissionCommand(rabId: string, id: string, path: string, body?: unknown, fallback = "Gagal memproses pengajuan"): Promise<Result> {
  try {
    await adminFetch(`/submissions/${id}/${path}`, {
      method: "POST",
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    revalidateProject(rabId);
    return { ok: true };
  } catch (err) {
    return fail(err, fallback);
  }
}

export async function submitSubmissionAction(rabId: string, id: string) {
  return submissionCommand(rabId, id, "submit", undefined, "Gagal mengirim pengajuan");
}

export async function reviewSubmissionAction(
  rabId: string,
  id: string,
  decision: "APPROVED" | "REJECTED",
  note: string | null
) {
  return submissionCommand(rabId, id, "review", { decision, note }, "Gagal menyimpan keputusan");
}

export async function forwardSubmissionAction(rabId: string, id: string) {
  return submissionCommand(rabId, id, "forward", undefined, "Gagal meneruskan ke klien");
}

export async function clientDecisionAction(
  rabId: string,
  id: string,
  decision: "APPROVED" | "REJECTED",
  decidedBy: string,
  note: string | null
) {
  return submissionCommand(
    rabId,
    id,
    "client-decision",
    { decision, decidedBy, note },
    "Gagal menyimpan keputusan klien"
  );
}

export async function applyTimeExtensionAction(rabId: string, id: string) {
  const result = await submissionCommand(rabId, id, "apply-schedule", undefined, "Gagal menerapkan ke jadwal");
  // Jadwal dan kurva S ikut berubah, jadi halamannya harus ikut disegarkan.
  if (result.ok) {
    revalidatePath(`/admin/rab/${rabId}/schedule`);
    revalidatePath(`/admin/rab/${rabId}/billings`);
  }
  return result;
}

export async function cancelSubmissionAction(rabId: string, id: string) {
  return submissionCommand(rabId, id, "cancel", undefined, "Gagal membatalkan pengajuan");
}

export async function deleteSubmissionAction(rabId: string, id: string): Promise<Result> {
  try {
    await adminFetch(`/submissions/${id}`, { method: "DELETE" });
    revalidateProject(rabId);
    return { ok: true };
  } catch (err) {
    return fail(err, "Gagal menghapus pengajuan");
  }
}

// --- Logbook -----------------------------------------------------------------

export interface LogbookPayload {
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
  attachments: DocAttachment[];
}

export async function saveLogbookAction(
  rabId: string,
  payload: LogbookPayload,
  entryId?: string
): Promise<Result> {
  try {
    if (entryId) {
      await adminFetch(`/rab/logbook/${entryId}`, { method: "PUT", body: JSON.stringify(payload) });
    } else {
      await adminFetch(`/rab/${rabId}/logbook`, { method: "POST", body: JSON.stringify(payload) });
    }
    revalidateProject(rabId);
    return { ok: true };
  } catch (err) {
    return fail(err, "Gagal menyimpan catatan logbook");
  }
}

export async function deleteLogbookAction(rabId: string, entryId: string): Promise<Result> {
  try {
    await adminFetch(`/rab/logbook/${entryId}`, { method: "DELETE" });
    revalidateProject(rabId);
    return { ok: true };
  } catch (err) {
    return fail(err, "Gagal menghapus catatan logbook");
  }
}

// --- Site memo ---------------------------------------------------------------

export interface MemoPayload {
  rabId: string;
  direction: MemoDirection;
  category: MemoCategory;
  subject: string;
  body: string;
  fromParty: string;
  toParty: string;
  letterDate: string;
  handledAt: string | null;
  dueDate: string | null;
  parentId: string | null;
  attachments: DocAttachment[];
}

export async function saveMemoAction(payload: MemoPayload, memoId?: string): Promise<Result> {
  try {
    if (memoId) {
      // Arah surat dan kaitannya ke surat yang dijawab ditetapkan sekali saat
      // dibuat: mengubahnya akan memutus utas yang sudah terbentuk.
      const body = omit(payload, ["rabId", "direction", "parentId"]);
      await adminFetch(`/site-memos/${memoId}`, { method: "PUT", body: JSON.stringify(body) });
    } else {
      await adminFetch("/site-memos", { method: "POST", body: JSON.stringify(payload) });
    }
    revalidateProject(payload.rabId);
    return { ok: true };
  } catch (err) {
    return fail(err, "Gagal menyimpan surat");
  }
}

export async function setMemoStatusAction(rabId: string, memoId: string, status: MemoStatus): Promise<Result> {
  try {
    await adminFetch(`/site-memos/${memoId}/status`, { method: "PUT", body: JSON.stringify({ status }) });
    revalidateProject(rabId);
    return { ok: true };
  } catch (err) {
    return fail(err, "Gagal mengubah status surat");
  }
}

export async function deleteMemoAction(rabId: string, memoId: string): Promise<Result> {
  try {
    await adminFetch(`/site-memos/${memoId}`, { method: "DELETE" });
    revalidateProject(rabId);
    return { ok: true };
  } catch (err) {
    return fail(err, "Gagal menghapus surat");
  }
}

// --- Surat-menyurat ----------------------------------------------------------

export interface LetterPayload {
  rabId: string;
  type: LetterType;
  subject: string;
  letterDate: string;
  dueDate: string | null;
  recipientName: string;
  recipientCompany: string | null;
  recipientAddress: string | null;
  attentionTo: string | null;
  signerName: string;
  signerTitle: string;
  signatoryId: string | null;
  counterSignerName: string | null;
  counterSignerTitle: string | null;
  amount: number;
  retentionAmount: number;
  taxPct: number;
  billingId: string | null;
  quotationId: string | null;
  parentLetterId: string | null;
  body: LetterBody;
  notes: string | null;
  attachments: DocAttachment[];
}

export async function saveLetterAction(payload: LetterPayload, letterId?: string): Promise<Result & { id?: string }> {
  try {
    if (letterId) {
      const body = omit(payload, ["rabId", "type"]);
      await adminFetch(`/letters/${letterId}`, { method: "PUT", body: JSON.stringify(body) });
      revalidateProject(payload.rabId);
      return { ok: true, id: letterId };
    }

    const created = await adminFetch<{ data: { id: string } }>("/letters", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    revalidateProject(payload.rabId);
    return { ok: true, id: created.data.id };
  } catch (err) {
    return fail(err, "Gagal menyimpan surat");
  }
}

/**
 * Isi awal formulir surat.
 *
 * Ditarik saat formulir dibuka, bukan saat halaman dirender: nilainya
 * bergantung pada jenis surat yang baru dipilih pemakai, dan memuat lima
 * kemungkinan sekaligus di server hanya untuk membuang empat di antaranya
 * adalah empat kueri yang tidak pernah dipakai.
 */
export async function letterDefaultsAction(
  rabId: string,
  type: LetterType,
  billingId?: string
): Promise<{ ok: boolean; defaults?: LetterDefaults; message?: string }> {
  try {
    const qs = new URLSearchParams({ rabId, type, ...(billingId ? { billingId } : {}) });
    const res = await adminFetch<{ data: { defaults: LetterDefaults } }>(`/letters/defaults?${qs.toString()}`);
    return { ok: true, defaults: res.data.defaults };
  } catch (err) {
    return fail(err, "Gagal menyiapkan isi surat");
  }
}

export async function issueLetterAction(rabId: string, letterId: string): Promise<Result> {
  try {
    await adminFetch(`/letters/${letterId}/issue`, { method: "POST" });
    revalidateProject(rabId);
    return { ok: true };
  } catch (err) {
    return fail(err, "Gagal menerbitkan surat");
  }
}

export async function setLetterStatusAction(
  rabId: string,
  letterId: string,
  status: LetterStatus
): Promise<Result> {
  try {
    await adminFetch(`/letters/${letterId}/status`, { method: "PUT", body: JSON.stringify({ status }) });
    revalidateProject(rabId);
    return { ok: true };
  } catch (err) {
    return fail(err, "Gagal mengubah status surat");
  }
}

export async function deleteLetterAction(rabId: string, letterId: string): Promise<Result> {
  try {
    await adminFetch(`/letters/${letterId}`, { method: "DELETE" });
    revalidateProject(rabId);
    return { ok: true };
  } catch (err) {
    return fail(err, "Gagal menghapus surat");
  }
}

// --- Unduhan -----------------------------------------------------------------

type CsvResult = { ok: boolean; csv?: string; filename?: string; message?: string };

async function downloadCsv(path: string, filename: string, fallback: string): Promise<CsvResult> {
  try {
    const csv = await adminFetch<string>(path, { raw: true });
    return { ok: true, csv, filename };
  } catch (err) {
    return { ok: false, message: err instanceof AdminApiError ? err.message : fallback };
  }
}

export async function exportLogbookCsvAction(rabId: string) {
  return downloadCsv(`/rab/${rabId}/logbook.csv`, "logbook.csv", "Gagal mengunduh logbook");
}

export async function exportWeeklyCsvAction(rabId: string) {
  return downloadCsv(`/rab/${rabId}/reports/weekly.csv`, "laporan-mingguan.csv", "Gagal mengunduh laporan mingguan");
}

export async function exportMonthlyCsvAction(rabId: string) {
  return downloadCsv(`/rab/${rabId}/reports/monthly.csv`, "laporan-bulanan.csv", "Gagal mengunduh laporan bulanan");
}
