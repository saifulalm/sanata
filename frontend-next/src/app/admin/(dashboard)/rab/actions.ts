"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminFetch, AdminApiError } from "@/lib/adminApi";
import type { BillingPreview, Rab, RabStatus } from "@/lib/estimation";

export type RabActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export interface RabItemPayload {
  ahspId: string | null;
  description: string;
  unit: string;
  volume: string;
  unitPrice: string;
}

export interface RabSectionPayload {
  name: string;
  items: RabItemPayload[];
}

interface RabPayload {
  title: string;
  clientName: string | null;
  location: string | null;
  projectDate: string | null;
  status: RabStatus;
  taxPct: string;
  discountPct: string;
  notes: string | null;
  sections: RabSectionPayload[];
}

/** Struktur section/item dikirim sebagai satu JSON karena jumlah barisnya dinamis. */
function readForm(formData: FormData): RabPayload {
  let sections: RabSectionPayload[] = [];
  try {
    const parsed: unknown = JSON.parse(String(formData.get("sections") ?? "[]"));
    if (Array.isArray(parsed)) {
      sections = parsed
        .filter((s): s is RabSectionPayload => Boolean(s) && typeof s === "object" && Boolean(s.name))
        .map((s) => ({
          name: String(s.name),
          items: (Array.isArray(s.items) ? s.items : [])
            .filter((i) => i && String(i.description).trim())
            .map((i) => ({
              ahspId: i.ahspId || null,
              description: String(i.description),
              unit: String(i.unit || "ls"),
              volume: String(i.volume || "0"),
              unitPrice: String(i.unitPrice || "0"),
            })),
        }));
    }
  } catch {
    sections = [];
  }

  return {
    title: String(formData.get("title") ?? "").trim(),
    clientName: String(formData.get("clientName") ?? "").trim() || null,
    location: String(formData.get("location") ?? "").trim() || null,
        projectDate: String(formData.get("projectDate") ?? "").trim()
          ? new Date(String(formData.get("projectDate"))).toISOString()
          : null,
    status: (String(formData.get("status") ?? "DRAFT") as RabStatus) || "DRAFT",
    taxPct: String(formData.get("taxPct") ?? "11").trim(),
    discountPct: String(formData.get("discountPct") ?? "0").trim(),
    notes: String(formData.get("notes") ?? "").trim() || null,
    sections,
  };
}

export async function createRabAction(_prev: RabActionState, formData: FormData): Promise<RabActionState> {
  let id: string;
  try {
    const res = await adminFetch<{ data: Rab }>("/rab", {
      method: "POST",
      body: JSON.stringify(readForm(formData)),
    });
    id = res.data.id;
  } catch (err) {
    return { status: "error", message: err instanceof AdminApiError ? err.message : "Gagal menyimpan RAB" };
  }
  // redirect() melempar internal, jadi harus di luar blok try.
  revalidatePath("/admin/rab");
  redirect(`/admin/rab/${id}`);
}

export async function updateRabAction(
  id: string,
  _prev: RabActionState,
  formData: FormData
): Promise<RabActionState> {
  try {
    await adminFetch(`/rab/${id}`, { method: "PUT", body: JSON.stringify(readForm(formData)) });
    revalidatePath("/admin/rab");
    revalidatePath(`/admin/rab/${id}`);
    return { status: "success", message: "RAB tersimpan" };
  } catch (err) {
    return { status: "error", message: err instanceof AdminApiError ? err.message : "Gagal menyimpan RAB" };
  }
}

export async function deleteRabAction(id: string): Promise<{ ok: boolean; message?: string }> {
  try {
    await adminFetch(`/rab/${id}`, { method: "DELETE" });
    revalidatePath("/admin/rab");
    return { ok: true };
  } catch (err) {
    return { ok: false, message: err instanceof AdminApiError ? err.message : "Gagal menghapus RAB" };
  }
}

/** Unduh CSV lewat server agar token akses tidak pernah menyentuh browser. */
export async function exportRabCsvAction(id: string): Promise<{ ok: boolean; csv?: string; filename?: string; message?: string }> {
  try {
    const csv = await adminFetch<string>(`/rab/${id}/export.csv`, { raw: true });
    const rab = await adminFetch<{ data: Rab }>(`/rab/${id}`);
    return { ok: true, csv, filename: `${rab.data.number.replace(/\//g, "-")}.csv` };
  } catch (err) {
    return { ok: false, message: err instanceof AdminApiError ? err.message : "Gagal mengunduh CSV" };
  }
}

export async function exportTakeoffCsvAction(
  id: string
): Promise<{ ok: boolean; csv?: string; filename?: string; message?: string }> {
  try {
    const csv = await adminFetch<string>(`/rab/${id}/takeoff.csv`, { raw: true });
    const rab = await adminFetch<{ data: Rab }>(`/rab/${id}`);
    return { ok: true, csv, filename: `${rab.data.number.replace(/\//g, "-")}-takeoff.csv` };
  } catch (err) {
    return { ok: false, message: err instanceof AdminApiError ? err.message : "Gagal mengunduh takeoff" };
  }
}

// --- Jadwal pelaksanaan & kurva S -------------------------------------------

export interface ScheduleItemPayload {
  id: string;
  startOffsetDays: number;
  durationDays: number;
}

type Result = { ok: boolean; message?: string };

function fail(err: unknown, fallback: string): Result {
  return { ok: false, message: err instanceof AdminApiError ? err.message : fallback };
}

export async function saveScheduleAction(
  rabId: string,
  scheduleStart: string | null,
  items: ScheduleItemPayload[],
  restDays: number[],
  holidays: { date: string; name: string }[]
): Promise<Result> {
  try {
    await adminFetch(`/rab/${rabId}/schedule`, {
      method: "PUT",
      body: JSON.stringify({ scheduleStart, items, restDays, holidays }),
    });
    revalidatePath(`/admin/rab/${rabId}/schedule`);
    return { ok: true };
  } catch (err) {
    return fail(err, "Gagal menyimpan jadwal");
  }
}

export async function recordProgressAction(
  rabId: string,
  itemId: string,
  date: string,
  percent: number,
  note: string | null,
  photos: { url: string; caption: string | null }[] = []
): Promise<Result> {
  try {
    await adminFetch(`/rab/items/${itemId}/progress`, {
      method: "POST",
      body: JSON.stringify({ date, percent, note, photos }),
    });
    revalidatePath(`/admin/rab/${rabId}/schedule`);
    return { ok: true };
  } catch (err) {
    return fail(err, "Gagal menyimpan opname");
  }
}

export async function reviewProgressAction(
  rabId: string,
  progressId: string,
  decision: "APPROVED" | "REJECTED",
  reason: string | null
): Promise<Result> {
  try {
    await adminFetch(`/rab/progress/${progressId}/review`, {
      method: "POST",
      body: JSON.stringify({ decision, reason }),
    });
    revalidatePath(`/admin/rab/${rabId}/schedule`);
    return { ok: true };
  } catch (err) {
    return fail(err, "Gagal memproses pemeriksaan");
  }
}

export async function captureBaselineAction(rabId: string, name: string): Promise<Result> {
  try {
    await adminFetch(`/rab/${rabId}/baselines`, { method: "POST", body: JSON.stringify({ name }) });
    revalidatePath(`/admin/rab/${rabId}/schedule`);
    return { ok: true };
  } catch (err) {
    return fail(err, "Gagal mengunci baseline");
  }
}

export async function deleteBaselineAction(rabId: string, baselineId: string): Promise<Result> {
  try {
    await adminFetch(`/rab/baselines/${baselineId}`, { method: "DELETE" });
    revalidatePath(`/admin/rab/${rabId}/schedule`);
    return { ok: true };
  } catch (err) {
    return fail(err, "Gagal menghapus baseline");
  }
}

// --- Laporan harian ---------------------------------------------------------

export interface DailyReportPayload {
  date: string;
  weatherMorning: string | null;
  weatherAfternoon: string | null;
  workforce: Record<string, number> | null;
  equipment: string | null;
  materials: string | null;
  activities: string;
  obstacles: string | null;
  notes: string | null;
  photos: { url: string; caption: string | null; location: string | null }[];
}

export async function saveDailyReportAction(
  rabId: string,
  reportId: string | null,
  payload: DailyReportPayload
): Promise<Result> {
  try {
    await adminFetch(reportId ? `/rab/daily-reports/${reportId}` : `/rab/${rabId}/daily-reports`, {
      method: reportId ? "PUT" : "POST",
      body: JSON.stringify(payload),
    });
    revalidatePath(`/admin/rab/${rabId}/daily-reports`);
    return { ok: true };
  } catch (err) {
    return fail(err, "Gagal menyimpan laporan harian");
  }
}

export async function deleteDailyReportAction(rabId: string, reportId: string): Promise<Result> {
  try {
    await adminFetch(`/rab/daily-reports/${reportId}`, { method: "DELETE" });
    revalidatePath(`/admin/rab/${rabId}/daily-reports`);
    return { ok: true };
  } catch (err) {
    return fail(err, "Gagal menghapus laporan harian");
  }
}

// --- Termin -----------------------------------------------------------------

export async function previewBillingAction(
  rabId: string,
  periodEnd: string,
  retentionPct: number,
  taxPct: number
): Promise<{ ok: boolean; message?: string; preview?: BillingPreview }> {
  try {
    const res = await adminFetch<{ data: BillingPreview }>(`/rab/${rabId}/billings/preview`, {
      method: "POST",
      body: JSON.stringify({ periodEnd, retentionPct, taxPct }),
    });
    return { ok: true, preview: res.data };
  } catch (err) {
    return fail(err, "Gagal menghitung pratinjau termin");
  }
}

export async function createBillingAction(
  rabId: string,
  periodEnd: string,
  retentionPct: number,
  taxPct: number,
  notes: string | null
): Promise<Result> {
  try {
    await adminFetch(`/rab/${rabId}/billings`, {
      method: "POST",
      body: JSON.stringify({ periodEnd, retentionPct, taxPct, notes }),
    });
    revalidatePath(`/admin/rab/${rabId}/billings`);
    return { ok: true };
  } catch (err) {
    return fail(err, "Gagal membuat termin");
  }
}

export async function setBillingStatusAction(
  rabId: string,
  billingId: string,
  status: "DRAFT" | "ISSUED" | "PAID" | "CANCELLED"
): Promise<Result> {
  try {
    await adminFetch(`/rab/billings/${billingId}/status`, { method: "PUT", body: JSON.stringify({ status }) });
    revalidatePath(`/admin/rab/${rabId}/billings`);
    return { ok: true };
  } catch (err) {
    return fail(err, "Gagal mengubah status termin");
  }
}

export async function deleteBillingAction(rabId: string, billingId: string): Promise<Result> {
  try {
    await adminFetch(`/rab/billings/${billingId}`, { method: "DELETE" });
    revalidatePath(`/admin/rab/${rabId}/billings`);
    return { ok: true };
  } catch (err) {
    return fail(err, "Gagal menghapus termin");
  }
}

export async function exportBillingCsvAction(
  billingId: string
): Promise<{ ok: boolean; csv?: string; filename?: string; message?: string }> {
  try {
    const csv = await adminFetch<string>(`/rab/billings/${billingId}/export.csv`, { raw: true });
    return { ok: true, csv, filename: `berita-acara-${billingId}.csv` };
  } catch (err) {
    return fail(err, "Gagal mengunduh berita acara");
  }
}

export async function exportScheduleCsvAction(
  id: string
): Promise<{ ok: boolean; csv?: string; filename?: string; message?: string }> {
  try {
    const csv = await adminFetch<string>(`/rab/${id}/schedule.csv`, { raw: true });
    const rab = await adminFetch<{ data: Rab }>(`/rab/${id}`);
    return { ok: true, csv, filename: `${rab.data.number.replace(/\//g, "-")}-kurva-s.csv` };
  } catch (err) {
    return { ok: false, message: err instanceof AdminApiError ? err.message : "Gagal mengunduh kurva S" };
  }
}
