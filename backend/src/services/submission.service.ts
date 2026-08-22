import { Prisma, type SubmissionStatus, type SubmissionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/ApiError";
import { money, sum, toDecimal } from "@/utils/money";
import { addDays, isoDate, parseDateOnly, startOfUtcDay, todayInProjectZone } from "@/utils/date";
import { parsePagination, buildMeta } from "@/utils/pagination";
import { allocateDocumentNumber, type DocumentSeries } from "@/services/documentNumber.service";
import type {
  SubmissionClientDecisionInput,
  SubmissionInput,
  SubmissionReviewInput,
  SubmissionUpdateInput,
} from "@/validators/projectDoc.validator";

/**
 * Pengajuan lapangan: alat, material, waktu, dan rencana waktu.
 *
 * Yang membuat modul ini bukan sekadar formulir adalah rantai wewenangnya.
 * Site engineer mengajukan, atasan memeriksa, dan khusus ajuan waktu keputusan
 * masih harus diteruskan ke pemilik proyek karena menyangkut tanggal serah
 * terima di kontrak. Status disimpan terpisah untuk tiap tahap supaya
 * pertanyaan "ini sudah sampai mana" punya satu jawaban, bukan tafsiran.
 *
 * Transisi status dijaga di satu tempat di bawah. Tanpa itu, tombol di panel
 * admin akan menjadi satu-satunya pengaman, dan panel admin bukan pengaman.
 */

/** Rangkaian nomor per jenis pengajuan. */
const SERIES_BY_TYPE: Record<SubmissionType, DocumentSeries> = {
  ALAT: "AJU_ALAT",
  MATERIAL: "AJU_MATERIAL",
  WAKTU: "AJU_WAKTU",
  RENCANA_WAKTU: "AJU_RENCANA",
};

/**
 * Hanya ajuan waktu yang naik ke pemilik proyek.
 *
 * Alat dan material adalah urusan internal kontraktor — memaksa klien
 * menyetujui pembelian semen hanya akan menghentikan pekerjaan.
 */
export function needsClientApproval(type: SubmissionType): boolean {
  return type === "WAKTU";
}

const ALLOWED_TRANSITIONS: Record<SubmissionStatus, SubmissionStatus[]> = {
  DRAFT: ["SUBMITTED", "CANCELLED"],
  SUBMITTED: ["APPROVED_INTERNAL", "REJECTED", "DRAFT", "CANCELLED"],
  APPROVED_INTERNAL: ["FORWARDED_CLIENT", "CANCELLED"],
  FORWARDED_CLIENT: ["APPROVED_CLIENT", "REJECTED", "CANCELLED"],
  APPROVED_CLIENT: ["CANCELLED"],
  REJECTED: ["DRAFT", "CANCELLED"],
  CANCELLED: [],
};

function assertTransition(from: SubmissionStatus, to: SubmissionStatus) {
  if (!ALLOWED_TRANSITIONS[from].includes(to)) {
    throw ApiError.badRequest(`Pengajuan tidak dapat berpindah dari ${from} ke ${to}`);
  }
}

const include = {
  items: { orderBy: { order: "asc" } },
  requestedBy: { select: { id: true, name: true } },
  reviewedBy: { select: { id: true, name: true } },
  rab: { select: { id: true, number: true, title: true, clientName: true } },
} as const;

type SubmissionRow = Prisma.ProjectSubmissionGetPayload<{ include: typeof include }>;

export interface SubmissionAttachment {
  url: string;
  name: string;
}

function serialize(row: SubmissionRow) {
  return {
    id: row.id,
    number: row.number,
    rabId: row.rabId,
    rab: row.rab,
    type: row.type,
    status: row.status,
    title: row.title,
    reason: row.reason,
    neededDate: row.neededDate ? isoDate(startOfUtcDay(row.neededDate)) : null,
    requestedDays: row.requestedDays,
    newTargetDate: row.newTargetDate ? isoDate(startOfUtcDay(row.newTargetDate)) : null,
    estimatedCost: money(row.estimatedCost).toString(),
    attachments: (row.attachments as SubmissionAttachment[] | null) ?? [],
    requestedByName: row.requestedBy.name,
    submittedAt: row.submittedAt?.toISOString() ?? null,
    reviewedByName: row.reviewedBy?.name ?? null,
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    reviewNote: row.reviewNote,
    forwardedAt: row.forwardedAt?.toISOString() ?? null,
    clientDecidedAt: row.clientDecidedAt?.toISOString() ?? null,
    clientDecidedBy: row.clientDecidedBy,
    clientNote: row.clientNote,
    needsClientApproval: needsClientApproval(row.type),
    /// Sudah lewat tanggal dibutuhkan tapi belum diputuskan — inilah yang
    /// membuat pengajuan menghambat pekerjaan, bukan sekadar menunggu.
    isOverdue:
      row.neededDate != null &&
      startOfUtcDay(row.neededDate) < todayInProjectZone() &&
      !["APPROVED_INTERNAL", "APPROVED_CLIENT", "REJECTED", "CANCELLED"].includes(row.status),
    items: row.items.map((i) => ({
      id: i.id,
      name: i.name,
      spec: i.spec,
      unit: i.unit,
      quantity: i.quantity.toString(),
      unitPrice: money(i.unitPrice).toString(),
      amount: money(i.amount).toString(),
      note: i.note,
    })),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export type Submission = ReturnType<typeof serialize>;

/** Baris rincian berikut nilainya — dihitung server-side, tidak pernah dipercaya dari klien. */
function itemData(input: Pick<SubmissionInput, "items">) {
  return (input.items ?? []).map((item, index) => {
    const quantity = toDecimal(item.quantity);
    const unitPrice = toDecimal(item.unitPrice ?? 0);
    return {
      name: item.name,
      spec: item.spec ?? null,
      unit: item.unit,
      quantity,
      unitPrice: money(unitPrice),
      amount: money(quantity.mul(unitPrice)),
      note: item.note ?? null,
      order: index,
    };
  });
}

export async function listSubmissions(query: {
  page?: unknown;
  pageSize?: unknown;
  rabId?: string;
  type?: string;
  status?: string;
  search?: string;
}) {
  const { page, pageSize, skip, take } = parsePagination(query as Record<string, unknown>);

  const where: Prisma.ProjectSubmissionWhereInput = {
    ...(query.rabId ? { rabId: query.rabId } : {}),
    ...(query.type ? { type: query.type as SubmissionType } : {}),
    ...(query.status ? { status: query.status as SubmissionStatus } : {}),
    ...(query.search
      ? {
          OR: [
            { number: { contains: query.search, mode: "insensitive" } },
            { title: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.projectSubmission.findMany({ where, skip, take, orderBy: { createdAt: "desc" }, include }),
    prisma.projectSubmission.count({ where }),
  ]);

  return { items: rows.map(serialize), meta: buildMeta(page, pageSize, total) };
}

export async function getSubmission(id: string) {
  const row = await prisma.projectSubmission.findUnique({ where: { id }, include });
  if (!row) throw ApiError.notFound("Pengajuan tidak ditemukan");
  return serialize(row);
}

export async function createSubmission(input: SubmissionInput, userId: string) {
  const rab = await prisma.rab.findUnique({ where: { id: input.rabId }, select: { id: true } });
  if (!rab) throw ApiError.notFound("Proyek/RAB tidak ditemukan");

  const items = itemData(input);

  const created = await prisma.$transaction(async (tx) => {
    const number = input.number?.trim() || (await allocateDocumentNumber(SERIES_BY_TYPE[input.type], tx));

    if (input.number?.trim()) {
      const clash = await tx.projectSubmission.findUnique({ where: { number } });
      if (clash) throw ApiError.conflict(`Nomor pengajuan "${number}" sudah dipakai`);
    }

    return tx.projectSubmission.create({
      data: {
        number,
        rabId: input.rabId,
        type: input.type,
        title: input.title,
        reason: input.reason ?? null,
        neededDate: input.neededDate ? parseDateOnly(input.neededDate) : null,
        requestedDays: input.requestedDays ?? null,
        newTargetDate: input.newTargetDate ? parseDateOnly(input.newTargetDate) : null,
        estimatedCost: sum(items.map((i) => i.amount)),
        attachments: (input.attachments ?? []) as unknown as Prisma.InputJsonValue,
        requestedById: userId,
        items: items.length > 0 ? { create: items } : undefined,
      },
      include,
    });
  });

  return serialize(created);
}

/**
 * Sunting isi pengajuan.
 *
 * Hanya boleh saat masih draft atau setelah ditolak. Setelah atasan memeriksa,
 * mengubah isinya berarti persetujuan yang tercatat melekat pada dokumen yang
 * bukan lagi dokumen yang dibaca saat memutuskan.
 */
export async function updateSubmission(id: string, input: SubmissionUpdateInput) {
  const existing = await prisma.projectSubmission.findUnique({
    where: { id },
    select: { id: true, status: true, number: true },
  });
  if (!existing) throw ApiError.notFound("Pengajuan tidak ditemukan");

  if (!["DRAFT", "REJECTED"].includes(existing.status)) {
    throw ApiError.badRequest(
      "Pengajuan yang sudah diperiksa tidak dapat diubah — batalkan lalu buat pengajuan baru bila perlu"
    );
  }

  if (input.number && input.number.trim() !== existing.number) {
    const clash = await prisma.projectSubmission.findUnique({ where: { number: input.number.trim() } });
    if (clash) throw ApiError.conflict(`Nomor pengajuan "${input.number}" sudah dipakai`);
  }

  const items = input.items !== undefined ? itemData({ items: input.items }) : null;

  const updated = await prisma.$transaction(async (tx) => {
    if (items) {
      // Rincian dikirim utuh setiap simpan: hapus lalu tulis ulang jauh lebih
      // sederhana daripada mencocokkan selisihnya, dan jumlahnya selalu kecil.
      await tx.projectSubmissionItem.deleteMany({ where: { submissionId: id } });
      if (items.length > 0) {
        await tx.projectSubmissionItem.createMany({
          data: items.map((i) => ({ ...i, submissionId: id })),
        });
      }
    }

    return tx.projectSubmission.update({
      where: { id },
      data: {
        ...(input.number !== undefined ? { number: input.number?.trim() || existing.number } : {}),
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.reason !== undefined ? { reason: input.reason ?? null } : {}),
        ...(input.neededDate !== undefined
          ? { neededDate: input.neededDate ? parseDateOnly(input.neededDate) : null }
          : {}),
        ...(input.requestedDays !== undefined ? { requestedDays: input.requestedDays ?? null } : {}),
        ...(input.newTargetDate !== undefined
          ? { newTargetDate: input.newTargetDate ? parseDateOnly(input.newTargetDate) : null }
          : {}),
        ...(input.attachments !== undefined
          ? { attachments: (input.attachments ?? []) as unknown as Prisma.InputJsonValue }
          : {}),
        ...(items ? { estimatedCost: sum(items.map((i) => i.amount)) } : {}),
        // Revisi setelah penolakan mengembalikan dokumen ke draft: keputusan
        // lama tidak boleh menempel pada isi yang sudah berubah.
        ...(existing.status === "REJECTED"
          ? { status: "DRAFT" as const, reviewedById: null, reviewedAt: null, reviewNote: null }
          : {}),
      },
      include,
    });
  });

  return serialize(updated);
}

/** Kirim ke atasan. */
export async function submitSubmission(id: string) {
  const existing = await prisma.projectSubmission.findUnique({ where: { id }, select: { status: true } });
  if (!existing) throw ApiError.notFound("Pengajuan tidak ditemukan");
  assertTransition(existing.status, "SUBMITTED");

  const updated = await prisma.projectSubmission.update({
    where: { id },
    data: { status: "SUBMITTED", submittedAt: new Date() },
    include,
  });
  return serialize(updated);
}

/** Keputusan atasan. */
export async function reviewSubmission(id: string, input: SubmissionReviewInput, userId: string) {
  const existing = await prisma.projectSubmission.findUnique({ where: { id }, select: { status: true } });
  if (!existing) throw ApiError.notFound("Pengajuan tidak ditemukan");

  const next: SubmissionStatus = input.decision === "APPROVED" ? "APPROVED_INTERNAL" : "REJECTED";
  assertTransition(existing.status, next);

  const updated = await prisma.projectSubmission.update({
    where: { id },
    data: {
      status: next,
      reviewedById: userId,
      reviewedAt: new Date(),
      reviewNote: input.note ?? null,
    },
    include,
  });
  return serialize(updated);
}

/** Teruskan ajuan waktu yang sudah disetujui atasan ke pemilik proyek. */
export async function forwardSubmission(id: string) {
  const existing = await prisma.projectSubmission.findUnique({
    where: { id },
    select: { status: true, type: true },
  });
  if (!existing) throw ApiError.notFound("Pengajuan tidak ditemukan");

  if (!needsClientApproval(existing.type)) {
    throw ApiError.badRequest("Hanya ajuan waktu yang perlu diteruskan ke pemilik proyek");
  }
  assertTransition(existing.status, "FORWARDED_CLIENT");

  const updated = await prisma.projectSubmission.update({
    where: { id },
    data: { status: "FORWARDED_CLIENT", forwardedAt: new Date() },
    include,
  });
  return serialize(updated);
}

/** Keputusan pemilik proyek atas ajuan waktu. */
export async function recordClientDecision(id: string, input: SubmissionClientDecisionInput) {
  const existing = await prisma.projectSubmission.findUnique({ where: { id }, select: { status: true } });
  if (!existing) throw ApiError.notFound("Pengajuan tidak ditemukan");

  const next: SubmissionStatus = input.decision === "APPROVED" ? "APPROVED_CLIENT" : "REJECTED";
  assertTransition(existing.status, next);

  const updated = await prisma.projectSubmission.update({
    where: { id },
    data: {
      status: next,
      clientDecidedAt: new Date(),
      clientDecidedBy: input.decidedBy,
      clientNote: input.note ?? null,
    },
    include,
  });
  return serialize(updated);
}

export async function cancelSubmission(id: string) {
  const existing = await prisma.projectSubmission.findUnique({ where: { id }, select: { status: true } });
  if (!existing) throw ApiError.notFound("Pengajuan tidak ditemukan");
  assertTransition(existing.status, "CANCELLED");

  const updated = await prisma.projectSubmission.update({
    where: { id },
    data: { status: "CANCELLED" },
    include,
  });
  return serialize(updated);
}

export async function deleteSubmission(id: string) {
  const existing = await prisma.projectSubmission.findUnique({ where: { id }, select: { status: true } });
  if (!existing) throw ApiError.notFound("Pengajuan tidak ditemukan");
  if (existing.status !== "DRAFT") {
    throw ApiError.badRequest(
      "Pengajuan yang sudah dikirim tidak dapat dihapus — batalkan saja agar jejaknya tetap ada"
    );
  }
  await prisma.projectSubmission.delete({ where: { id } });
}

/**
 * Terapkan ajuan waktu yang sudah disetujui klien ke jadwal proyek.
 *
 * Persetujuan perpanjangan waktu tidak ada gunanya bila kurva rencana tetap
 * memakai target lama: seluruh laporan sesudahnya akan menunjukkan
 * keterlambatan yang sebenarnya sudah dimaafkan. Yang digeser hanya tanggal
 * mulai pekerjaan yang belum berjalan, bukan seluruh jadwal — pekerjaan yang
 * sudah selesai tidak pindah tanggal hanya karena ada tambahan waktu.
 *
 * Baseline dianjurkan diambil sebelum ini dijalankan; itu urusan pemakai, dan
 * panel admin mengingatkannya.
 */
export async function applyTimeExtension(id: string) {
  const submission = await prisma.projectSubmission.findUnique({
    where: { id },
    include: { rab: { select: { id: true, scheduleStart: true } } },
  });
  if (!submission) throw ApiError.notFound("Pengajuan tidak ditemukan");

  if (submission.type !== "WAKTU") {
    throw ApiError.badRequest("Hanya ajuan waktu yang bisa diterapkan ke jadwal");
  }
  if (submission.status !== "APPROVED_CLIENT") {
    throw ApiError.badRequest("Ajuan waktu baru bisa diterapkan setelah disetujui pemilik proyek");
  }
  if (!submission.requestedDays || submission.requestedDays <= 0) {
    throw ApiError.badRequest("Ajuan waktu tidak menyebutkan jumlah hari tambahan");
  }

  const label = `Perpanjangan waktu ${submission.number}`;

  // Menerapkan dua kali akan memberi tambahan waktu dua kali lipat, dan karena
  // tanggalnya dihitung dari "hari ini", pengulangan di hari lain menghasilkan
  // rentang yang berbeda sehingga `skipDuplicates` pun tidak menahannya. Yang
  // menjadi penanda adalah nama hari liburnya, yang memuat nomor pengajuan.
  const alreadyApplied = await prisma.rabHoliday.findFirst({
    where: { rabId: submission.rabId, name: label },
    select: { id: true },
  });
  if (alreadyApplied) {
    throw ApiError.badRequest(`Ajuan ${submission.number} sudah pernah diterapkan ke jadwal proyek`);
  }

  // Hari tambahan diberikan sebagai hari libur proyek berurutan mulai hari ini.
  // Cara ini menahan seluruh pekerjaan yang belum jalan tanpa menyentuh offset
  // satu per satu, dan tetap terbaca di kalender sebagai "waktu yang diberikan
  // pemilik proyek" — bukan perubahan diam-diam pada durasi pekerjaan.
  const from = todayInProjectZone();
  const dates = Array.from({ length: submission.requestedDays }, (_, offset) => ({
    rabId: submission.rabId,
    date: addDays(from, offset),
    name: label,
  }));

  await prisma.rabHoliday.createMany({
    data: dates,
    // Tanggal yang sudah tercatat libur karena sebab lain tidak dihitung dua kali.
    skipDuplicates: true,
  });

  return getSubmission(id);
}
